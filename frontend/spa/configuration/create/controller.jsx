var CreateConfigurationController = function(view) {
    var context = this;
    context.view = view;

    context.saveWallet = function saveWallet(words, password) {
        client.userManager.save(words, password);
    }
}