function ContractsManager() {
    var context = this;

    context.SEEDTokenAddress = ecosystemData.seedTokenAddress;
    context.factoryAddress = ecosystemData.factoryAddress;
    context.dexAddress = ecosystemData.dexAddress;

    context.seedOf = async function seedOf(address) {
        return await context.tokenBalanceOf(context.SEEDTokenAddress, address);
    };

    context.tokenBalanceOf = async function tokenBalanceOf(contract, address) {
        return await context.call(contracts.Token, contract, 'balanceOf', address);
    };

    context.call = async function call() {
        var contractType = arguments[0];
        var address = arguments[1];
        var methodName = arguments[2];
        var args = [];
        if(arguments.length > 3) {
            for(var i = 3; i < arguments.length; i++) {
                args.push(arguments[i]);
            }
        }

        var outputs = undefined;

        try {
            outputs = Enumerable.From(Enumerable.From(contractType).Where(it => it.type === 'function' && it.name === methodName && ((!it.inputs && args.length === 0) || it.inputs.length === args.length)).First().outputs).Select(it => it.type).ToArray();
        } catch(e) {
            console.error(e);
        }

        var contract = new web3.eth.Contract(contractType);
        var method = contract.methods[methodName].apply(contract, args);
        var result = await client.blockchainManager.call(address, method.encodeABI());
        if(!outputs || outputs.length === 0) {
            return;
        }
        result = web3.eth.abi.decodeParameters(outputs, result);
        return ((result.__length__ || Object.keys(result).length) > 1 ? result : result['0']);
    };

    context.submit = async function submit() {
        var title = arguments[0];
        var lock = arguments[1];
        var contractType = arguments[2];
        var address = arguments[3];
        var methodName = arguments[4];
        var args = [];
        if(arguments.length > 5) {
            for(var i = 5; i < arguments.length; i++) {
                args.push(arguments[i]);
            }
        }
        var contract = new web3.eth.Contract(contractType);
        var method = contract.methods[methodName].apply(contract, args);
        var signedTransaction = await client.userManager.signTransaction(address, method.encodeABI());
        return await client.blockchainManager.sendSignedTransaction(signedTransaction, title, lock);
    };

    context.getList = function getList() {
        var list = client.persistenceManager.get(client.persistenceManager.PERSISTENCE_PROPERTIES.list);
        if (list === undefined || list === null) {
            list = {};
        }
        return list;
    };

    context.getArray = function getArray() {
        var array = [];
        var list = context.getList();
        Object.keys(list).map(function(key) {
            array.push(list[key]);
        });
        return array;
    };

    context.getDictionary = function getDictionary() {
        context.dictionary = [];
        context.dictionary.push({
            address: context.factoryAddress.toLowerCase(),
            type: 'factory'
        });
        context.dictionary.push({
            address: context.dexAddress.toLowerCase(),
            type: 'dex'
        });
        context.dictionary.push({
            address: context.SEEDTokenAddress.toLowerCase(),
            type: 'SEEDToken'
        });
        var list = context.getList();
        var keys = Object.keys(list);
        for (var i in keys) {
            var element = list[keys[i]];
            context.dictionary.push({
                address: element.tokenAddress.toLowerCase(),
                type: 'token',
                element: element,
                position: keys[i]
            });
            context.dictionary.push({
                address: element.fundingPanelAddress.toLowerCase(),
                type: 'fundingPanel',
                element: element,
                position: keys[i]
            });
            context.dictionary.push({
                address: element.adminsToolsAddress.toLowerCase(),
                type: 'adminsTools',
                element: element,
                position: keys[i]
            });
        }
        return (context.dictionary = Enumerable.From(context.dictionary));
    };

    context.getAllEventsAsTopics = function getAllEventsAsTopics() {
        var events = [];
        context.getContractEvents(contracts.Factory, events);
        context.getContractEvents(contracts.AdminTools, events);
        context.getContractEvents(contracts.FundingPanel, events);
        context.getContractEvents(contracts.Token, events);
        var topics = [];
        for (var i in events) {
            topics.push([events[i]]);
        }
        return topics;
    };

    context.getContractEvents = function getContractEvents(contractAbi, events) {
        Object.keys(new web3.eth.Contract(contractAbi).events).map(name => {
            if (name.indexOf('(') === -1) {
                return;
            }
            events.push(web3.utils.keccak256(name));
        });
    };

    context.getFundingPanelData = async function getFundingPanelData(product, force) {
        if (!product) {
            return;
        }
        var checkDate = force !== true;
        if (checkDate) {
            checkDate = product.name !== undefined && product.name !== null;
        }
        if (checkDate) {
            try {
                checkDate = !Enumerable.From(client.userManager.user.list).Contains(product.position);
            } catch (e) {
            }
        }
        var lastCheck = new Date().getTime();
        if (checkDate === true && typeof product.lastCheck !== 'undefined' && lastCheck - product.lastCheck <= 60000) {
            return;
        }
        product.lastCheck = lastCheck;

        var contract = new web3.eth.Contract(contracts.FundingPanel);

        var data = contract.methods.getOwnerData().encodeABI();
        var result = await client.blockchainManager.call(product.fundingPanelAddress, data);
        result = web3.eth.abi.decodeParameters(['string', 'bytes32'], result);
        product.documentUrl = result['0'];
        product.documentHash = result['1'];

        data = contract.methods.exchangeRateOnTop().encodeABI();
        result = await client.blockchainManager.call(product.fundingPanelAddress, data);
        result = web3.eth.abi.decodeParameters(['uint256'], result);
        product.exchangeRateOnTop = parseInt(result['0']);

        data = contract.methods.exchangeRateSeed().encodeABI();
        result = await client.blockchainManager.call(product.fundingPanelAddress, data);
        result = web3.eth.abi.decodeParameters(['uint256'], result);
        product.seedRate = parseInt(result['0']);

        data = contract.methods.seedMaxSupply().encodeABI();
        result = await client.blockchainManager.call(product.fundingPanelAddress, data);
        result = web3.eth.abi.decodeParameters(['uint256'], result);
        product.totalSupply = parseInt(result['0']);

        data = contract.methods.getTotalRaised().encodeABI();
        result = await client.blockchainManager.call(product.fundingPanelAddress, data);
        result = web3.eth.abi.decodeParameters(['uint256'], result);
        product.totalRaised = parseInt(result['0']);

        contract = new web3.eth.Contract(contracts.AdminTools);
        data = contract.methods.getWLThresholdBalance().encodeABI();
        result = await client.blockchainManager.call(product.adminsToolsAddress, data);
        result = web3.eth.abi.decodeParameters(['uint256'], result);
        product.whiteListThreshold = parseInt(result['0']);

        contract = new web3.eth.Contract(contracts.Token);
        data = contract.methods.symbol().encodeABI();
        result = await client.blockchainManager.call(product.tokenAddress, data);
        result = web3.eth.abi.decodeParameters(['string'], result);
        product.symbol = result['0'];

        product.members = [];
        contract = new web3.eth.Contract(contracts.FundingPanel);
        data = contract.methods.getMembersNumber().encodeABI();
        result = await client.blockchainManager.call(product.fundingPanelAddress, data);
        result = web3.eth.abi.decodeParameters(['uint256'], result);
        var members = parseInt(result['0']);
        for (var i = 0; i < members; i++) {
            var member = {
                position: i
            };
            contract = new web3.eth.Contract(contracts.FundingPanel);
            data = contract.methods.getMemberAddressByIndex(i).encodeABI();
            result = await client.blockchainManager.call(product.fundingPanelAddress, data);
            result = web3.eth.abi.decodeParameters(['address'], result);
            member.address = result['0'];

            data = contract.methods.getMemberDataByAddress(member.address).encodeABI();
            result = await client.blockchainManager.call(product.fundingPanelAddress, data);
            result = web3.eth.abi.decodeParameters(['bool', 'uint8', 'string', 'bytes32', 'uint256', 'uint'], result);

            member.disabled = parseInt(result['1']);
            member.documentUrl = result['2'];
            member.documentHash = result['3'];

            contract = new web3.eth.Contract(contracts.Token);
            data = contract.methods.balanceOf(member.address).encodeABI();
            result = await client.blockchainManager.call(context.SEEDTokenAddress, data);
            result = web3.eth.abi.decodeParameters(['uint256'], result);
            member.totalRaised = result['0'];

            product.members.push(member);
        }
        var call = false;
        try {
            await new Promise(async function (ok, ko) {
                var deleteTimeout = setTimeout(function () {
                    product.unavailable = true;
                    setTimeout(function() {
                        context.getFundingPanelData(product, force);
                    }, 45000);
                    ko();
                }, 7000);
                $.get({
                    url: product.documentUrl,
                    dataType: 'json',
                    cache: false,
                    success: data => {
                        clearTimeout(deleteTimeout);
                        call = product.unavailable !== undefined && product.unavailable !== null;
                        delete product.unavailable;
                        Object.keys(data).map(key => product[key] = data[key]);
                        ok();
                    }
                });
            });
            for (var i in product.members) {
                await context.refreshMember(product.members[i]);
            }
            (call || force) && $.publish('fundingPanel/' + product.position + '/updated', product);
        } catch(e) {
        }
        return product;
    };

    context.refreshMember = async function refreshMember(product, fundingPanelAddress, force) {
        if(!product) {
            return;
        }
        if (fundingPanelAddress !== undefined && fundingPanelAddress !== null && fundingPanelAddress.split(' ').join('') === '') {
            var contract = new web3.eth.Contract(contracts.FundingPanel);
            var data = contract.methods.getMemberAddressByIndex(i).encodeABI();
            var result = await client.blockchainManager.call(fundingPanelAddress, data);
            result = web3.eth.abi.decodeParameters(['address'], result);
            member.address = result['0'];

            data = contract.methods.getMemberDataByAddress(member.address).encodeABI();
            result = await client.blockchainManager.call(fundingPanelAddress, data);
            result = web3.eth.abi.decodeParameters(['bool', 'uint8', 'string', 'bytes32', 'uint256', 'uint'], result);

            member.disabled = parseInt(result['1']);
            member.documentUrl = result['2'];
            member.documentHash = result['3'];

            contract = new web3.eth.Contract(contracts.Token);
            data = contract.methods.balanceOf(member.address).encodeABI();
            result = await client.blockchainManager.call(context.SEEDTokenAddress, data);
            result = web3.eth.abi.decodeParameters(['uint256'], result);
            member.totalRaised = result['0'];
        }
        var call = false;
        await new Promise(async function (ok, ko) {
            var deleteTimeout = setTimeout(function () {
                product.unavailable = true;
                setTimeout(function() {
                    context.refreshMember(product, fundingPanelAddress, force);
                }, 45000);
                ko();
            }, 7000);
            $.get({
                url: product.documentUrl,
                dataType: 'json',
                cache: false,
                success: data => {
                    clearTimeout(deleteTimeout);
                    call = product.unavailable !== undefined && product.unavailable !== null;
                    delete product.unavailable;
                    ok(product);
                }
            });
        });
        (call || force) && $.publish('fundingPanel/' + product.position + '/updated', product);
    };

    context['0xb9f320ca5d6edcd5b5ec403b3a0970d8ff03a3ab365497b976507b20e27c7067'] = async function memberDisabled(event, element) {
        var product = element.element || element;
        await context.getFundingPanelData(product, true);
        $.publish('fundingPanel/' + product.position + '/updated', product);
    };

    context['0x0dcb0d206ae1380b9262e6ac8529c80879595c33706fa1199edd4a7ef72cf3a1'] = async function memberEnabled(event, element) {
        var product = element.element || element;
        await context.getFundingPanelData(product, true);
        $.publish('fundingPanel/' + product.position + '/updated', product);
    };

    context['0x94d9b0a056867efca93631b338c7fde3befc3f54db36b90b8456b069385c30be'] = async function newMemberCreated(event, element) {
        var product = element.element || element;
        await context.getFundingPanelData(product, true);
        $.publish('fundingPanel/' + product.position + '/updated', product);
    };

    context['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'] = async function erc20Transfer(event, element) {
        if(element.type !== 'SEEDToken') {
            return;
        }
        var product = web3.eth.abi.decodeParameters(['address'], event.topics[2])[0].toLowerCase();
        product = Enumerable.From(context.getArray()).Where(it => it.fundingPanelAddress.toLowerCase() === product).FirstOrDefault();
        if(!product) {
            return;
        }

        var result = await context.call(contracts.FundingPanel, product.fundingPanelAddress, "getTotalRaised");
        product.totalRaised = parseInt(result);

        var investor = web3.eth.abi.decodeParameters(['address'], event.topics[1])[0].toLowerCase();
        var amount = parseInt(web3.eth.abi.decodeParameters(['uint256'], event.data)[0]);
        !product.investors && (product.investors = {});
        !product.investors[investor] && (product.investors[investor] = 0);
        product.investors[investor] += amount;
        $.publish('fundingPanel/' + product.position + '/updated', product);
        try {
            if(client.userManager.user.wallet.toLowerCase() === investor.toLowerCase()) {
                $('investment/mine', product);
            }
        } catch(e) {
        } 
    };

    context['0xb4630f894cab42818aa587f8d4fc219b8472578638e808b23df12161ad730af6'] = async function fundingPanelDataChanged(event, element) {
        var list = context.getList();
        element = list[element.position];
        delete element.name;
        delete element.url;
        delete element.hash;
        await context.getFundingPanelData(element, true);
        client.persistenceManager.set(client.persistenceManager.PERSISTENCE_PROPERTIES.list, list);
        try {
            for (var i in client.userManager.user.list) {
                var position = client.userManager.user.list[i];
                if (element.position === position) {
                    $.publish('user/list/updated', element);
                    return;
                }
            }
        } catch {
        }
    };

    context['0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925'] = async function allowanceIncreased(event, element) {
        $.publish('allowance/increased', element);
        element.position !== undefined && $.publish('fundingPanel/' + element.position + '/updated', element);
    };

    context['0x28e958703d566ea9825155c28c95c3d92a2da219b51404343e4653bccd47525a'] = async function newFundingPanel(event, element) {
        var data = web3.eth.abi.decodeParameters(['address', 'address', 'address', 'address', 'uint'], event.data);

        var position = (parseInt(data['4']) - 1).toString();
        var list = context.getList();
        if (list[position] !== undefined && list[position] !== null) {
            return;
        }
        var element = {
            owner: data['0'],
            adminsToolsAddress: data['1'],
            tokenAddress: data['2'],
            fundingPanelAddress: data['3'],
            position
        };
        list[position] = element;
        client.persistenceManager.set(client.persistenceManager.PERSISTENCE_PROPERTIES.list, list);
        var alsoUser = false;
        try {
            if (element.owner.toLowerCase() === client.userManager.user.wallet.toLowerCase()) {
                !client.userManager.user.list && (client.userManager.user.list = []);
                client.userManager.user.list.push(position);
                client.persistenceManager.set(client.persistenceManager.PERSISTENCE_PROPERTIES.user, user);
                alsoUser = true;
                client.userManager.getBalances();
            }
        } catch {
        }
        $.publish('list/updated', element);
        alsoUser === true && $.publish('user/list/updated', element);
    };

    context.checkBaskets = async function checkBaskets() {
        if(client.persistenceManager.get('factoryAddress') !== context.factoryAddress) {
            client.persistenceManager.set('list', []);
        }
        var contract = new web3.eth.Contract(contracts.Factory);
        var data = contract.methods.getTotalFPContracts().encodeABI();
        var result = await client.blockchainManager.call(context.factoryAddress, data);
        result = web3.eth.abi.decodeParameters(['uint256'], result);
        result = parseInt(result['0']);
        if (result === 0) {
            return;
        }
        var list = context.getList();
        var indexes = Enumerable.From(Object.keys(list)).Select(it => parseInt(it));
        var missing = Enumerable.Range(0, result).Where(it => !indexes.Contains(it)).ToArray();
        if (missing.length === 0) {
            return;
        }
        for (var i in missing) {
            var index = missing[i];
            data = contract.methods.getContractsByIndex(index).encodeABI();
            result = await client.blockchainManager.call(context.factoryAddress, data);
            result = web3.eth.abi.decodeParameters(['address', 'address', 'address', 'address'], result);
            var element = {
                owner: result['0'],
                adminsToolsAddress: result['1'],
                tokenAddress: result['2'],
                fundingPanelAddress: result['3'],
                position: '' + index
            };
            list['' + index] = element;
        }
        client.persistenceManager.set(client.persistenceManager.PERSISTENCE_PROPERTIES.list, list);
        $.publish('list/updated', list);
        try {
            !client.userManager.user.list && (client.userManager.user.list = []);
            var elements = [];
            for (var i in missing) {
                var element = list[missing[i] + ''];
                if (element.owner.toLowerCase() === client.userManager.user.wallet.toLowerCase()) {
                    client.userManager.user.list.push(element.position);
                    elements.push(element);
                }
            }
            if (elements.length > 0) {
                client.persistenceManager.set(client.persistenceManager.PERSISTENCE_PROPERTIES.user, user);
            }
            for (var i in elements) {
                $.publish('user/list/updated', elements[i]);
            }
        } catch {
        }
    };
    client.collaterateStart.push(context.checkBaskets);
}