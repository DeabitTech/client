var Product = React.createClass({
    /*<dt className="d-block">Description</dt>
                        <dd>
                            <p>{product.description}</p>
                        </dd>*/
    requiredModules: [
        'spa/detail',
        'spa/fundingPool/edit'
    ],
    onClick(e) {
        e && e.preventDefault();
        //TODO MV Remove this when investor part is ready
        if (this.props.view !== 'mine') {
            return;
        }
        this.emit((this.props.type ? this.props.type : 'page') + '/change', this.props.view === 'mine' ? EditFundingPool : Detail, { element: this.getProduct(), type: this.props.type, view: this.props.view });
    },
    getDefaultSubscriptions() {
        var position = this.props.element.position;
        var subscriptions = {};
        subscriptions['fundingPanel/' + position + '/updated'] = element => this.setState({ product: element });
        return subscriptions;
    },
    getProduct() {
        return this.state && this.state.product ? this.state.product : this.props.element;
    },
    componentDidMount() {
        var product = this.getProduct();
        if (!product.name) {
            client.contractsManager.getFundingPanelData(product);
        }
    },
    render() {
        var product = this.getProduct();
        return (
            <div className="kt-portlet" onClick={this.onClick}>
                {product.name && <div className="kt-portlet__head">
                    <div className="kt-portlet__head-label">
                        <h3 className="kt-portlet__head-title">
                            {product.name + (product.symbol ? " (" + product.symbol + ")" : "")}
                        </h3>
                    </div>
                </div>}
                <div className="kt-portlet__body">
                    {product.name && <dl>
                        <dt>URL</dt>
                        <dd><a href={product.url} target="_blank">{product.url}</a></dd>
                        <br />
                        <dt>Latest Quotation:</dt>
                        <dd className="text-cta">{Utils.roundWei(product.value)} SEED</dd>
                    </dl>}
                    {!product.name && <Loader />}
                </div>
            </div>
        );
    }
});