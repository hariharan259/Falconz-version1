import DroneForm from '../components/drone-form.js';

const DronesView = {
    render: async (store) => {
        const drones = store.getDrones();
        const activeDroneId = store.state.activeDroneId;

        // Container for either the list or the form
        return `<div id="drones-view-content">${DronesView.renderList(drones, activeDroneId)}</div>`;
    },

    renderList: (drones, activeDroneId) => {
        if (drones.length === 0) {
            return `
                <div class="empty-state">
                    <h3>No drones configured</h3>
                    <p>Create your first drone to begin.</p>
                    <button class="btn btn-primary" id="btn-create-drone">Create Your First Drone</button>
                </div>
            `;
        }

        const cards = drones.map(d => `
            <div class="drone-card ${d.id === activeDroneId ? 'active' : ''}">
                <div class="drone-card-header">
                    <div>
                        <h3>${d.name}</h3>
                        <span class="drone-badge">${d.type}</span>
                    </div>
                    ${d.id === activeDroneId ? '<span class="drone-badge active-badge">ACTIVE</span>' : ''}
                </div>
                <div class="data-group">
                    <div class="data-label">Motors</div>
                    <div class="data-value">${d.motors.count !== null ? d.motors.count + 'x ' : ''}${d.motors.brand || ''} ${d.motors.kv !== null ? d.motors.kv + 'KV' : (d.motors.brand ? '' : '<span class="data-value unknown">Unknown</span>')}</div>
                </div>
                <div class="data-group">
                    <div class="data-label">Battery</div>
                    <div class="data-value">${d.battery.cellCount !== null ? d.battery.cellCount + 'S ' : ''}${d.battery.capacityMah !== null ? d.battery.capacityMah + 'mAh' : '<span class="data-value unknown">Unknown</span>'}</div>
                </div>
                <div class="drone-card-actions">
                    ${d.id !== activeDroneId ? `<button class="btn btn-sm btn-primary btn-set-active" data-id="${d.id}">Set Active</button>` : ''}
                    <button class="btn btn-sm btn-secondary btn-edit-drone" data-id="${d.id}">Edit</button>
                    <button class="btn btn-sm btn-secondary btn-duplicate-drone" data-id="${d.id}">Duplicate</button>
                    <button class="btn btn-sm btn-danger btn-delete-drone" data-id="${d.id}">Delete</button>
                </div>
            </div>
        `).join('');

        return `
            <div class="page-header">
                <h2>Drones</h2>
                <div class="actions-group">
                    <button class="btn btn-primary" id="btn-create-drone">Create Drone</button>
                </div>
            </div>
            <div class="drone-list">
                ${cards}
            </div>
        `;
    },

    mount: (store) => {
        const content = document.getElementById('drones-view-content');
        
        let currentForm = null;

        const showForm = (droneData = null) => {
            const isEdit = !!droneData;
            currentForm = new DroneForm(store, (savedData) => {
                if (isEdit) {
                    store.updateDrone(savedData.id, savedData);
                } else {
                    store.saveDrone(savedData);
                }
                refreshList();
            }, () => {
                refreshList();
            });
            content.innerHTML = currentForm.render(droneData);
            currentForm.mount();
        };

        const refreshList = () => {
            content.innerHTML = DronesView.renderList(store.getDrones(), store.state.activeDroneId);
            bindListEvents();
        };

        const bindListEvents = () => {
            const btnCreate = document.getElementById('btn-create-drone');
            if (btnCreate) btnCreate.addEventListener('click', () => showForm());

            document.querySelectorAll('.btn-edit-drone').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.getAttribute('data-id');
                    const drone = store.getDrones().find(d => d.id === id);
                    if (drone) showForm(drone);
                });
            });

            document.querySelectorAll('.btn-delete-drone').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    if (confirm("Delete this drone profile?")) {
                        const id = e.target.getAttribute('data-id');
                        store.deleteDrone(id);
                        refreshList();
                    }
                });
            });

            document.querySelectorAll('.btn-duplicate-drone').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.getAttribute('data-id');
                    store.duplicateDrone(id);
                    refreshList();
                });
            });

            document.querySelectorAll('.btn-set-active').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.getAttribute('data-id');
                    store.setActiveDrone(id);
                    refreshList();
                });
            });
        };

        bindListEvents();
    }
};

export default DronesView;
