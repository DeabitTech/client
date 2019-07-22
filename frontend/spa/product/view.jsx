var Product = React.createClass({
    requiredModules: [
        'spa/detail',
        'spa/fundingPool/edit'
    ],
    onClick(e) {
        e && e.preventDefault();
        if(!this.getProduct().name) {
            alert("Please, wait for the retrievement of all data");
            return;
        }
        this.emit('page/change', this.props.view === 'mine' ? EditFundingPool : Detail, { element: this.getProduct(), view: this.props.view });
    },
    getDefaultSubscriptions() {
        var position = this.props.element.position;
        var subscriptions = {};
        subscriptions['fundingPanel/' + position + '/updated'] = element => this.setState({ product: element });
        return subscriptions;
    },
    getProduct() {
        var product = this.state && this.state.product ? this.state.product : this.props.element;
        product.totalRaised = 0;
        try {
            Object.keys(product.investors).map(function(address) {
                product.totalRaised += product.investors[address];
            });
        } catch(e) {
        }
        return product;
    },
    componentDidMount() {
        this.tryUpdateProduct();
    },
    componentDidUpdate() {
        this.tryUpdateProduct();
    },
    tryUpdateProduct() {
        var _this = this;
        var product = _this.getProduct();
        (!product.name || product.unavailable) && client.contractsManager.getFundingPanelData(product).then(p => p && p.name && !p.unavailable && _this.setState({product : p}));
    },
    makeUnsuitable(e) {
        e && e.preventDefault();
        this.controller.makeUnsuitable(this.getProduct());
    },
    render() {
        var product = this.getProduct();
        return (
            <div className="kt-portlet" onClick={this.onClick}>
                <div className="kt-portlet__head">
                    <div className="kt-portlet__head-label">
                        {product.image && <img width="50" height="50" ref={ref => this.image = $(ref)} src={product.image ? ("data:image/png;base64, " + product.image) : ''} />}
                        {product.image && '\u00A0\u00A0\u00A0\u00A0'}
                        <h3 className="kt-portlet__head-title">
                            {product.name} {product.symbol && ((product.name ? "(" : "") + product.symbol + (product.name ? ")" : ""))}
                        </h3>
                    </div>
                    {!product.name && <div className="retrieving">
                        <div className="retrievingContainer row">
                            <div className="label col-md-8">Retrieveing data...</div>
                            <div className="spinner col-md-4">
                                <Loader/>
                            </div>
                        </div>
                    </div>}
                </div>
                <div className="kt-portlet__body">
                    <dl>
                        {product.url && [<dt>URL</dt>,
                        <dd><h4>{product.url}</h4></dd>,
                        <br />]}
                        <dt>Latest Quotation:</dt>
                        <dd className="text-cta">{product.value ? Utils.roundWei(product.value) : parseFloat((1/parseFloat(web3.utils.fromWei(Utils.numberToString(product.seedRate), 'ether'))).toFixed(2)).toLocaleString()} SEED</dd>
                        <br/>
                        <dt>Total Raised:</dt>
                        <dd className="text-cta">{Utils.roundWei(product.totalRaised)} SEED</dd>
                        {this.props.view === 'mine' && [<span>{'\u00A0'}{'\u00A0'}{'\u00A0'}{'\u00A0'}</span>,
                        <dd><button className="btn btn-pill micro btn-brand" onClick={this.makeUnsuitable}>Make Unsuitable</button></dd>]}
                    </dl>
                </div>
            </div>
        );
    }
});