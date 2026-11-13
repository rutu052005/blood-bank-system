import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { BloodUnit } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { Link } from 'react-router-dom';
import { Droplets, Plus, Filter, Search, ChevronRight } from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [units, setUnits] = useState<BloodUnit[]>([]);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedComponent, setSelectedComponent] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [newUnit, setNewUnit] = useState({
    hospital_id: 'H001',
    blood_group: 'O+',
    component: 'RBC',
    quantity_total: 5,
    collection_date: new Date().toISOString().split('T')[0],
    expiry_date: new Date(Date.now() + 35 * 86400000).toISOString().split('T')[0],
  });

  const fetchInventory = () => {
    api.getInventory().then(res => setUnits(res)).catch(() => {});
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addInventory(newUnit);
      setShowAddModal(false);
      fetchInventory();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredUnits = units.filter(u => {
    const matchSearch = u.id.toLowerCase().includes(search.toLowerCase()) || (u.hospital_name || '').toLowerCase().includes(search.toLowerCase());
    const matchGroup = !selectedGroup || u.blood_group === selectedGroup;
    const matchComponent = !selectedComponent || u.component === selectedComponent;
    return matchSearch && matchGroup && matchComponent;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Droplets className="w-6 h-6 text-emerald-400" /> Live Inventory & Stock Ledger
          </h1>
          <p className="text-xs text-zinc-400">
            Real-time blood reserves across all partner hospitals with automated shelf-life tracking.
          </p>
        </div>

        {hasRole('SYSTEM_ADMIN', 'INVENTORY_MANAGER') && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-crimson-600 hover:bg-crimson-700 text-white px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-md transition"
          >
            <Plus className="w-4 h-4" /> Add Inventory Unit
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Inventory ID or Hospital..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-crimson-500"
          />
        </div>

        <select
          value={selectedGroup}
          onChange={(e) => setSelectedGroup(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-slate-700 w-full sm:w-auto"
        >
          <option value="">All Blood Groups</option>
          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        <select
          value={selectedComponent}
          onChange={(e) => setSelectedComponent(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-slate-700 w-full sm:w-auto"
        >
          <option value="">All Components</option>
          {['RBC', 'PLATELETS', 'PLASMA', 'WHOLE_BLOOD'].map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Unit ID</th>
                <th className="p-3">Hospital</th>
                <th className="p-3">Group / Comp</th>
                <th className="p-3">Total Qty</th>
                <th className="p-3">Held</th>
                <th className="p-3">In Transit</th>
                <th className="p-3">Available</th>
                <th className="p-3">Expiry Date</th>
                <th className="p-3">Tier</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredUnits.map((unit) => {
                let tierBadge = 'bg-emerald-100 text-emerald-800';
                if (unit.tier === 'NEAR_EXPIRY') tierBadge = 'bg-amber-100 text-amber-800';
                if (unit.tier === 'CRITICAL') tierBadge = 'bg-rose-100 text-rose-800 font-bold animate-pulse';
                if (unit.status === 'EXPIRED') tierBadge = 'bg-slate-800 text-white font-bold';

                return (
                  <tr key={unit.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-bold text-slate-900">{unit.id}</td>
                    <td className="p-3 font-medium text-slate-700">{unit.hospital_name}</td>
                    <td className="p-3 font-bold text-slate-900">{unit.blood_group} {unit.component}</td>
                    <td className="p-3 font-mono">{unit.quantity_total}</td>
                    <td className="p-3 font-mono text-amber-600 font-bold">{unit.quantity_held}</td>
                    <td className="p-3 font-mono text-blue-600 font-bold">{unit.quantity_in_transit}</td>
                    <td className="p-3 font-mono text-emerald-600 font-black">{unit.available_quantity}</td>
                    <td className="p-3 font-mono text-slate-600">{unit.expiry_date}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold ${tierBadge}`}>
                        {unit.status === 'EXPIRED' ? 'EXPIRED' : (unit.tier || 'VALID')}
                      </span>
                    </td>
                    <td className="p-3">
                      <Link to={`/inventory/${unit.id}`} className="text-crimson-600 font-bold hover:underline flex items-center gap-0.5">
                        Details <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <h2 className="text-base font-extrabold text-slate-900">Add New Inventory Unit</h2>
            <form onSubmit={handleAddUnit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Hospital</label>
                <select
                  value={newUnit.hospital_id}
                  onChange={(e) => setNewUnit({ ...newUnit, hospital_id: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                >
                  <option value="H001">H001 KLE Hospital</option>
                  <option value="H002">H002 District Hospital</option>
                  <option value="H003">H003 City Care Hospital</option>
                  <option value="H004">H004 Sahyadri Medical Center</option>
                  <option value="H005">H005 Shree Hospital</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700">Blood Group</label>
                  <select
                    value={newUnit.blood_group}
                    onChange={(e) => setNewUnit({ ...newUnit, blood_group: e.target.value as any })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700">Component</label>
                  <select
                    value={newUnit.component}
                    onChange={(e) => setNewUnit({ ...newUnit, component: e.target.value as any })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  >
                    {['RBC', 'PLATELETS', 'PLASMA', 'WHOLE_BLOOD'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Quantity (Units)</label>
                <input
                  type="number"
                  min="1"
                  value={newUnit.quantity_total}
                  onChange={(e) => setNewUnit({ ...newUnit, quantity_total: parseInt(e.target.value, 10) })}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700">Collection Date</label>
                  <input
                    type="date"
                    value={newUnit.collection_date}
                    onChange={(e) => setNewUnit({ ...newUnit, collection_date: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Expiry Date</label>
                  <input
                    type="date"
                    value={newUnit.expiry_date}
                    onChange={(e) => setNewUnit({ ...newUnit, expiry_date: e.target.value })}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-extrabold bg-crimson-600 text-white hover:bg-crimson-700 rounded-lg shadow-md"
                >
                  Save Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
