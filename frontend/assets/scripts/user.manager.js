function UserManager() {
    var context = this;

    context.fromMnemonic = function fromMnemonic(words, pass) {
        context.save(ethers.Wallet.fromMnemonic(typeof words === 'object' ? words.join(' ') : words), pass);
    };

    context.fromEncryptedJson = function fromEncryptedJson(json, pass) {
        context.save(ethers.Wallet.fromEncryptedJson(json, pass), pass);
    };

    context.fromPrivateKey = function fromPrivateKey(privateKey, pass) {
        context.save(new ethers.Wallet(privateKey), pass);
    };

    context.save = function save(wallet, pass) {
        context.user = {
            wallet: wallet.address,
            privateKey: wallet.privateKey,
            list: client.contractsManager.getDictionary()
                .Where(it => it.element !== undefined)
                .Select(it => it.element)
                .Where(it => it.owner.toLowerCase() === wallet.address.toLowerCase())
                .Select(it => it.position)
                .Distinct().ToArray()
        };
        client.configurationManager.save(context.user, pass, true);
        context.init();
        setTimeout(() => $.publish('wallet/show'));
    };

    context.forget = function forget() {
        client.configurationManager.forget();
        delete context.user;
    };

    context.signTransaction = async function signTransaction(to, data, value) {
        var txParams = {
            to,
            data,
            value,
            from: context.user.wallet,
            chainId: await client.blockchainManager.getChainId(),
            nonce: await client.blockchainManager.getNonce(context.user.wallet),
            gasLimit: web3.utils.toHex('' + client.persistenceManager.get(client.persistenceManager.PERSISTENCE_PROPERTIES.gasLimit)),
            gasPrice: web3.utils.toHex(web3.utils.toWei('' + client.persistenceManager.get(client.persistenceManager.PERSISTENCE_PROPERTIES.gasPrice), 'gwei'))
        };
        txParams.value = web3.utils.toHex(txParams.value || '0');
        var tx = new ethereumjs.Tx(txParams);
        tx.sign(Buffer.from(context.user.privateKey.substring(2), 'hex'));
        var signedTX = "0x" + tx.serialize().toString('hex');
        return signedTX;
    };

    context.getBalances = async function getBalances(address) {
        if (!context.user || !context.user.wallet) {
            !address && $.publish('amount/eth', 0);
            !address && $.publish('amount/seed', 0);
            return {
                eth: 0,
                seed: 0,
                token: 0,
                dexEth: 0,
                dexSEED: 0,
                dexToken: 0
            };
        }
        var eth = await client.blockchainManager.balanceOf(context.user.wallet);
        !address && $.publish('amount/eth', eth);
        var seed = await client.contractsManager.seedOf(context.user.wallet);
        !address && $.publish('amount/seed', seed);
        var token = !address ? 0 : address.toLowerCase() === client.contractsManager.SEEDTokenAddress.toLowerCase() ? seed : (await client.contractsManager.tokenBalanceOf(address, context.user.wallet));
        var dexEth = !address ? 0 : (await client.contractsManager.SeedDex.balanceOf(client.contractsManager.dexAddress, '0x0000000000000000000000000000000000000000', context.user.wallet));
        var dexSEED = !address ? 0 : (await client.contractsManager.SeedDex.balanceOf(client.contractsManager.dexAddress, client.contractsManager.SEEDTokenAddress, context.user.wallet));
        var dexToken = !address ? 0 : address.toLowerCase() === client.contractsManager.SEEDTokenAddress.toLowerCase() ? dexSEED : (await client.contractsManager.SeedDex.balanceOf(client.contractsManager.dexAddress, address, context.user.wallet));
        return {
            eth,
            seed,
            token,
            dexEth,
            dexSEED,
            dexToken
        };
    };

    context.init = function init() {
        context.user = client.persistenceManager.get(client.persistenceManager.PERSISTENCE_PROPERTIES.user);
        $.publish('page/change', Choose);
    };
    $.subscribe('configuration/unlocked', context.init);
}