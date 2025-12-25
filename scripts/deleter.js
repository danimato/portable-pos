function confirmDelete(tab) {
    switch (tab) {
        case "inventory":
            deleteSelectedInventoryItems();
            break;
        default:
            console.error("Unknown tab for deletion:", tab);
            break;
    }
}

function cancelDelete(tab) {
    switch (tab) {
        case "inventory":
            hideDeletePrompt();
            break;
        default:
            console.error("Unknown tab for cancellation:", tab);
            break;
    }
}