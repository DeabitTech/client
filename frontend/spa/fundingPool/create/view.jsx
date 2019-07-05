var CreateFundingPool = React.createClass({
    requiredScripts: [
        "assets/plugins/summernote/summernote.min.js",
        "assets/plugins/summernote/summernote.css"
    ],
    getTitle() {
        if (!this.props.parent) {
            return "Create new Basket";
        }
        return (
            <div key={this.props.parent.name} className="kt-subheader__breadcrumbs">
                <h3 className="kt-subheader__title"><a href="javascript:;" className="kt-subheader__breadcrumbs-home" onClick={this.back}><i className="fas fa-arrow-left"></i></a></h3>
                <span className="kt-subheader__separator"></span>
                <h3 className="kt-subheader__title">Create new Startup for the Basket <strong>{this.props.parent.name}</strong></h3>
            </div>
        );
    },
    back(e) {
        e && e.preventDefault();
        var _this = this;
        var parent = _this.props.parent;
        this.emit((this.props.type || 'page') + '/change', this.props.view === 'mine' ? EditFundingPool : Detail, { element: parent, parent: null, fromBack: true, type: this.props.type, view: this.props.view }, () => _this.setProduct(parent));
    },
    setProduct(product) {
        var _this = this;
        this.setState({ product }, function () {
            _this.forceUpdate();
            setTimeout(() => _this.setState({ product }));
        });
    },
    deploy(e) {
        e && e.preventDefault();
        var image = '';
        try {
            image = this.image.attr('src').split("data:image/png;base64, ").join('');
        } catch (error) {
        }
        var name = ''
        try {
            name = this.name.value.split(' ').join('');
        } catch (error) {
        }
        if (name === '') {
            alert('Please insert the name of the new basket');
            return;
        }

        var url = ''
        try {
            url = this.url.value.split(' ').join('').toLowerCase();
        } catch (error) {
        }
        if (url !== '') {
            if (url.indexOf('http://') !== 0 && url.indexOf('https://') !== 0) {
                alert('URL must start with http:// or https://');
                return;
            }
            if (!url.match(this.controller.urlRegex)) {
                alert('Wrong URL');
                return;
            }
        }

        var tags = [];
        try {
            var tgs = this.tags.value.split(' ');
            for (var i in tgs) {
                var tag = tgs[i].split(' ').join('');
                if (tag.length > 0) {
                    tags.push(tag);
                }
            }
        } catch (error) {
        }

        var symbol = ''
        try {
            symbol = this.symbol.value.split(' ').join('');
        } catch (error) {
        }
        if (!this.props.parent && symbol === '') {
            alert('Symbol is mandatory');
            return;
        }

        var seedRate = 0;
        try {
            seedRate = parseInt(this.seedRate.value.split(' ').join(''));
        } catch (error) {
        }
        if (!this.props.parent && (isNaN(seedRate) || seedRate < 0)) {
            alert('SEED Rate is a mandatory positive number or zero');
            return;
        }

        var exangeRate = 0;
        try {
            exangeRate = parseInt(this.exangeRate.value.split(' ').join(''));
        } catch (error) {
        }
        if (!this.props.parent && (isNaN(exangeRate) || exangeRate < 0)) {
            alert('Exchange Rate is a mandatory positive number or zero');
            return;
        }

        var exchangeRateDecimals = 0;
        try {
            exchangeRateDecimals = parseInt(this.exchangeRateDecimals.value.split(' ').join(''));
        } catch (error) {
        }
        if (!this.props.parent && (isNaN(exchangeRateDecimals) || exangeRate < 0)) {
            alert('Exchange Rate decimals is a mandatory positive number or zero');
            return;
        }

        var totalSupply = 0;
        try {
            totalSupply = parseInt(this.totalSupply.value.split(' ').join(''));
        } catch (error) {
        }
        if (!this.props.parent && (isNaN(totalSupply) || totalSupply < 0)) {
            alert('Total Supply is a mandatory positive number or zero');
            return;
        }

        var walletAddress = '';
        try {
            walletAddress = this.walletAddress.value.split(' ').join('');
        } catch (error) {
        }
        if (this.props.parent && !Utils.isEthereumAddress(walletAddress)) {
            alert('Wallet address is mandatory');
            return;
        }
        var data = {
            name,
            description: $.base64.encode(this.description.summernote('code')),
            url,
            image,
            tags,
            documents: (this.state && this.state.documents) || [],
            symbol,
            seedRate,
            exangeRate,
            exchangeRateDecimals,
            totalSupply,
            walletAddress
        };
        var type = this.props.parent ? 'Startup' : 'Basket';
        this.controller['deploy' + type](data, this.props.parent);
    },
    loadImage(e) {
        e && e.preventDefault();
        var userChosenPath = require('electron').remote.dialog.showOpenDialog({
            defaultPath: require('electron').remote.app.getPath("desktop"),
            filters: [
                {
                    name: "Image logo",
                    extensions: ["png", "jpg", "jpeg", "bmp"]
                }
            ]
        });
        if (userChosenPath) {
            var file = require('electron').remote.require('fs').readFileSync(userChosenPath[0]).toString('base64');
            file = "data:image/png;base64, " + file;
            this.image.attr('src', file);
        }
    },
    addDocument(e) {
        e && e.preventDefault();
        var name = this.documentName.value;
        if (name.split(' ').join('') === '') {
            alert('Name is mandatory');
            return;
        }
        var link = this.documentLink.value;
        if (link.indexOf('http://') === -1 && link.indexOf('https://') === -1 && !window.require('electron').remote.require('fs').existsSync(link)) {
            alert('Link must be an existing file or start with http:// or https://');
            return;
        }
        var documents = (this.state && this.state.documents) || [];
        documents.push({
            name,
            link
        });
        this.documentName.value = '';
        this.documentLink.value = '';
        this.setState({ documents });
    },
    browseLocalDocument(e) {
        e && e.preventDefault();
        var userChosenPath = undefined;
        (userChosenPath = window.require('electron').remote.dialog.showOpenDialog({
            defaultPath: window.require('electron').remote.app.getPath("desktop"),
            options: {
                openDirectory: false,
                multiSelections: false
            }
        }));
        userChosenPath && (this.documentLink.value = userChosenPath);
    },
    deleteDocument(i, e) {
        e && e.preventDefault();
        var documents = this.state.documents;
        var doc = documents[i];
        documents.splice(i, 1);
        var _this = this;
        this.setState({ documents }, function () {
            _this.documentName.value = doc.name;
            _this.documentLink.value = doc.link;
        });
    },
    render() {
        return (
            <form className="kt-form" action="#">
                <div className="row">
                    <div className="col-md-2">
                        <h4>Name</h4>
                        <p className="small">of the {(this.props.parent && "Startup") || "Incubator"}</p>
                    </div>
                    <div className="col-md-10 form-group">
                        <input className="form-control form-control-last" type="text" ref={ref => this.name = ref} />
                    </div>
                </div>
                <br/>
                <div className="row">
                    <div className="col-md-2">
                        <h4>Description</h4>
                        <p className="small">of the {(this.props.parent && "Startup") || "Incubator"}</p>
                    </div>
                    <div className="col-md-10 editor">
                        <div ref={ref => ref && (this.description = $(ref)).summernote({ minHeight: 350, disableResizeEditor: true })} />
                    </div>
                </div>
                <br />
                <br />
                <div className="row">
                    <div className="col-md-12">
                        <h3>Documents</h3>
                        <p className="small">useful to enrich the description of the business model</p>
                    </div>
                </div>
                <br />
                <div className="row">
                    <div className="col-md-4">
                        <input className="form-control form-control-last" type="text" placeholder="Name" ref={ref => this.documentName = ref} />
                    </div>
                    <div className="col-md-4">
                        <input className="form-control form-control-last" type="text" placeholder="Link" ref={ref => this.documentLink = ref} />
                    </div>
                    <div className="col-md-2">
                        <button type="button" className="btn btn-secondary btn-pill tiny" onClick={this.browseLocalDocument}>Browse from your pc</button>
                    </div>
                    <div className="col-md-2">
                        <button type="button" className="btn btn-brand btn-pill tiny" onClick={this.addDocument}>Add</button>
                    </div>
                </div>
                <br />
                <br />
                {this.state && this.state.documents && this.state.documents.map((it, i) =>
                    <div key={'document_' + i} className="row">
                        <div className="col-md-2">
                        </div>
                        <div className="col-md-4">
                            <span>{it.name}</span>
                        </div>
                        <div className="col-md-4">
                            {it.link.indexOf('http') !== 0 && <span>{it.link}</span>}
                            {it.link.indexOf('http') === 0 && <a href={it.link} target="_blank">{it.link}</a>}
                        </div>
                        <div className="col-md-2">
                            <h3>
                                <a href="javascript:;" onClick={e => this.deleteDocument(i, e)}><i className="fas fa-remove"></i></a>
                            </h3>
                        </div>
                    </div>
                )}
                <br />
                <br />
                <div className="row">
                    <div className="col-md-2">
                        <h4>URL</h4>
                        <p className="small">The website of the {this.props.parent ? "Startup" : "Incubator"}</p>
                    </div>
                    <div className="col-md-10 form-group">
                        <input className="form-control form-control-last" type="text" ref={ref => this.url = ref} />
                    </div>
                </div>
                <br/>
                <div className="row">
                    <div className="col-md-2">
                        <h4>Logo</h4>
                        <p className="small">of the {this.props.parent ? "Startup" : "Incubator"}</p>
                    </div>
                    <div className="col-md-10 form-group">
                        <a href="javascript:;" onClick={this.loadImage}>
                            <img width="100" height="100" ref={ref => this.image = $(ref)} />
                        </a>
                    </div>
                </div>
                {!this.props.parent && <br/>}
                {!this.props.parent && <div className="row">
                    <div className="col-md-2">
                        <h4>Tags</h4>
                        <p className="small">useful for searches by the investor</p>
                    </div>
                    <div className="col-md-10 form-group">
                        <input className="form-control form-control-last" type="text" ref={ref => this.tags = ref} />
                    </div>
                </div>}
                {!this.props.parent && <br/>}
                {!this.props.parent && <div className="row">
                    <div className="col-md-2">
                        <h4>Symbol</h4>
                        <p className="small">of the new token you will mint</p>
                    </div>
                    <div className="col-md-10 form-group">
                        <input className="form-control form-control-last" type="TEXT" ref={ref => this.symbol = ref} />
                    </div>
                </div>}
                {!this.props.parent && <br/>}
                {!this.props.parent && <div className="row">
                    <div className="col-md-2">
                        <h4>SEED Rate</h4>
                        <p className="small">the value in SEED of every single Token</p>
                    </div>
                    <div className="col-md-10 form-group">
                        <input className="form-control form-control-last" type="number" ref={ref => this.seedRate = ref} />
                    </div>
                </div>}
                {!this.props.parent && <br/>}
                {!this.props.parent && <div className="row">
                    <div className="col-md-2">
                        <h4>Exchange Rate</h4>
                        <p className="small">the amount hold by the incubator from each donation</p>
                    </div>
                    <div className="col-md-10 form-group">
                        <input className="form-control form-control-last" type="number" ref={ref => this.exangeRate = ref} />
                    </div>
                </div>}
                {!this.props.parent && <br/>}
                {!this.props.parent && <div className="row">
                    <div className="col-md-2">
                        <h4>Exchange Rate Decimals</h4>
                        <p className="small">the amount hold by the incubator from each donation</p>
                    </div>
                    <div className="col-md-10 form-group">
                        <input className="form-control form-control-last" type="number" ref={ref => this.exchangeRateDecimals = ref} />
                    </div>
                </div>}
                {!this.props.parent && <br/>}
                {!this.props.parent && <div className="row">
                    <div className="col-md-2">
                        <h4>Total Supply</h4>
                        <p className="small">The amount to raise in this campaign</p>
                    </div>
                    <div className="col-md-10 form-group">
                        <input className="form-control form-control-last" type="number" ref={ref => this.totalSupply = ref} />
                    </div>
                </div>}
                {this.props.parent && <br/>}
                {this.props.parent && <div className="row">
                    <div className="col-md-2">
                        <h4>Wallet Address</h4>
                        <p className="small">The one used by the Startup to raise the unlocked funds</p>
                    </div>
                    <div className="col-md-10 form-group">
                        <input className="form-control form-control-last" type="address" ref={ref => this.walletAddress = ref} />
                    </div>
                </div>}
                <br/>
                <div className="row">
                    <div className="col-md-12">
                        <button type="button" className="btn btn-brand btn-pill" onClick={this.deploy}>DEPLOY</button>
                    </div>
                </div>
            </form>
        );
    }
});