const BACKUP_STORES = ['products', 'inventory', 'orders', 'order_items', 'inventory_history', 'settings'];

async function exportBackup() {
    try {
        const backup = {
            version: 1,
            exported_at: new Date().toISOString(),
            data: {}
        };

        for (const store of BACKUP_STORES) {
            backup.data[store] = await db.getAll(store);
        }

        const json = JSON.stringify(backup, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        const date = new Date().toISOString().slice(0, 10);
        a.download = `quicktrack-backup-${date}.json`;
        a.click();
        URL.revokeObjectURL(url);

        showToast('Backup Exported', 'Your data has been saved to a JSON file.', 3000);
    } catch (e) {
        showToast('Export Failed', `Could not export backup: ${e}`, 5000);
    }
}

async function importBackup(file) {
    if (!file) return;

    try {
        const text = await file.text();
        const backup = JSON.parse(text);

        if (!backup.data) {
            showToast('Invalid File', 'This file is not a valid QuickTrack backup.', 3000);
            return;
        }

        for (const store of BACKUP_STORES) {
            if (!backup.data[store]) continue;
            await db.clear(store);
            for (const record of backup.data[store]) {
                await db.update(store, record);
            }
        }

        showToast('Backup Restored', 'All data restored successfully. Reloading...', 3000);
        setTimeout(() => location.reload(), 3000);
    } catch (e) {
        showToast('Import Failed', `Could not restore backup: ${e}`, 5000);
    }
}
