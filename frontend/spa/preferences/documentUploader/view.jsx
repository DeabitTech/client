var DocumentUploader = React.createClass({
    urlRegex: new RegExp(/(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi),
    onChange(e) {
        e && e.preventDefault() && e.stopPropagation();
        this.documentUploaderLink.value = '';
        this.documentUploaderLink.style.display = e.target.value.indexOf('ipfs') === -1 ? 'block' : 'none';
    },
    changeDocumentUploader(e) {
        e && e.preventDefault() && e.stopPropagation();
        var type = '';
        try {
            type = this.documentUploaderType.value || ecosysyemData.documentUploaderProvider;
        } catch (error) {
        }
        var url = ''
        if (type.indexOf('ipfs') === -1) {
            try {
                url = this.documentUploaderLink.value.split(' ').join('').toLowerCase();
            } catch (error) {
            }
            if (url === '') {
                alert('Please, insert a valid URL');
                return;
            }
            if (url.indexOf('http://') !== 0 && url.indexOf('https://') !== 0) {
                alert('URL must start with http:// or https://');
                return;
            }
            if (!url.match(this.urlRegex)) {
                alert('Invalid URL format');
                return;
            }
        }
        var _this = this;
        _this.controller.changeDocumentUploader(type, url).then(_this.showUpdated);
    },
    showUpdated() {
        var _this = this;
        setTimeout(() => _this.updateNotification.show());
        setTimeout(() => _this.updateNotification.hide(), 2000);
    },
    componentDidMount() {
        try {
            this.documentUploaderLink.style.display = client.persistenceManager.get(client.persistenceManager.PERSISTENCE_PROPERTIES.documentsUploaderProvider).indexOf('ipfs') === -1 ? 'block' : 'none';
        } catch(e) {
        }
    },
    render() {
        return (
            <form className="kt-form" action="">
                {!this.props.onClick && <legend>Documents Location Preferences</legend>}
                <div className="form-group mb-5">
                    <select onChange={this.onChange} ref={ref => this.documentUploaderType = ref}>
                        <option value="assets/scripts/documents.uploader.provider.ipfs.http.js" selected={client.persistenceManager.get(client.persistenceManager.PERSISTENCE_PROPERTIES.documentsUploaderProvider).indexOf('ipfs') !== -1}>IPFS</option>
                        <option value="assets/scripts/documents.uploader.provider.http.js" selected={client.persistenceManager.get(client.persistenceManager.PERSISTENCE_PROPERTIES.documentsUploaderProvider).indexOf('ipfs') === -1}>CUSTOM</option>
                    </select>
                </div>
                <div className="form-group mb-5">
                    <input className="form-control form-control-last" type="text" placeholder="Link must start with http:// or https://" ref={ref => (this.documentUploaderLink = ref) && (this.documentUploaderLink.value = client.persistenceManager.get(client.persistenceManager.PERSISTENCE_PROPERTIES.documentsUploaderHost))} />
                </div>
                <div className="form-group mb-5">
                    <button className="btn btn-brand btn-pill btn-elevate browse-btn" onClick={this.changeDocumentUploader}>Change Document Uploader</button>{"\u00A0"}{"\u00A0"}{"\u00A0"}<span ref={ref => (this.updateNotification = $(ref)).hide()}>Changes Updated</span>
                </div>
            </form>
        );
    }
});