import React, { useState } from 'react';
import { Smartphone, Plus, Pencil, Trash2, Search, X } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input'; // Need to create Input
import { Modal } from '../components/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/Table';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { useMock, Phone, Spec } from '../mock/MockContext';
import { useToast } from '../components/Toast';
import { ACTIONS } from '../actionMap';
import { cn } from '../lib/utils';

export function Phones() {
    const { phones, addPhone, updatePhone, deletePhone } = useMock();
    const { toast } = useToast();
    const [selectedPhoneId, setSelectedPhoneId] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingPhone, setEditingPhone] = useState<Phone | null>(null);

    const selectedPhone = phones.find(p => p.id === selectedPhoneId);

    const handleEdit = (phone: Phone) => {
        setEditingPhone({ ...phone });
        setIsEditModalOpen(true);
    };

    const handleAdd = () => {
        setEditingPhone({
            id: Math.random().toString(36).substr(2, 9),
            name: '',
            brand: '',
            specs: []
        });
        setIsEditModalOpen(true);
    };

    const handeSave = () => {
        if (!editingPhone || !editingPhone.name) return;

        if (phones.find(p => p.id === editingPhone.id)) {
            updatePhone(editingPhone);
            toast("Phone updated successfully", "success");
        } else {
            addPhone(editingPhone);
            toast("Phone added successfully", "success");
        }
        setIsEditModalOpen(false);
    };

    const handleDelete = () => {
        if (selectedPhoneId) {
            deletePhone(selectedPhoneId);
            setSelectedPhoneId(null);
            setIsDeleteModalOpen(false);
            toast("Phone deleted", "info");
        }
    };

    // Specs Editor helpers
    const updateSpec = (index: number, field: keyof Spec, value: string) => {
        if (!editingPhone) return;
        const newSpecs = [...editingPhone.specs];
        newSpecs[index] = { ...newSpecs[index], [field]: value };
        setEditingPhone({ ...editingPhone, specs: newSpecs });
    };

    const addSpec = () => {
        if (!editingPhone) return;
        setEditingPhone({
            ...editingPhone,
            specs: [...editingPhone.specs, { key: '', label: '', value: '' }]
        });
    };

    const removeSpec = (index: number) => {
        if (!editingPhone) return;
        const newSpecs = [...editingPhone.specs];
        newSpecs.splice(index, 1);
        setEditingPhone({ ...editingPhone, specs: newSpecs });
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
            {/* List Panel */}
            <div className="w-full lg:w-1/3 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-800">Phones directory</h2>
                    <Button size="sm" action={ACTIONS.MPCS_PHONES_ADD} onClick={handleAdd}>
                        <Plus className="w-4 h-4 mr-2" /> Add
                    </Button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search phones..."
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                </div>

                <div className="flex-1 overflow-y-auto bg-white rounded-lg border border-slate-200 shadow-sm">
                    {phones.length === 0 ? (
                        <EmptyState
                            icon={Smartphone}
                            title="No phones yet"
                            description="Add your first phone to get started"
                            actionLabel="Add Phone"
                            actionId={ACTIONS.MPCS_PHONES_ADD}
                            onAction={handleAdd}
                        />
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {phones.map(phone => (
                                <div
                                    key={phone.id}
                                    onClick={() => setSelectedPhoneId(phone.id)}
                                    className={cn(
                                        "p-4 cursor-pointer transition-colors hover:bg-slate-50 flex items-center justify-between",
                                        selectedPhoneId === phone.id && "bg-blue-50/50 hover:bg-blue-50 border-l-4 border-blue-500 pl-3"
                                    )}
                                >
                                    <div>
                                        <p className="font-medium text-slate-900">{phone.name}</p>
                                        <p className="text-xs text-slate-500">{phone.brand} • {phone.specs.length} specs</p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                        <Smartphone className="w-4 h-4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Details Panel */}
            <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col">
                {selectedPhone ? (
                    <>
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h2 className="text-xl font-bold text-slate-900">{selectedPhone.name}</h2>
                                    <Badge variant="secondary">{selectedPhone.brand}</Badge>
                                </div>
                                <p className="text-sm text-slate-500">ID: {selectedPhone.id}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="secondary" action={ACTIONS.MPCS_PHONES_EDIT} onClick={() => handleEdit(selectedPhone)}>
                                    <Pencil className="w-4 h-4 mr-2" /> Edit
                                </Button>
                                <Button variant="danger" action={ACTIONS.MPCS_PHONES_DELETE} onClick={() => setIsDeleteModalOpen(true)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <h3 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">Specifications</h3>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Spec Key</TableHead>
                                        <TableHead>Label</TableHead>
                                        <TableHead>Value</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedPhone.specs.map((spec, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-mono text-xs text-slate-500">{spec.key}</TableCell>
                                            <TableCell className="font-medium">{spec.label}</TableCell>
                                            <TableCell>{spec.value}</TableCell>
                                        </TableRow>
                                    ))}
                                    {selectedPhone.specs.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-slate-400 py-8">No specs defined</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </>
                ) : (
                    <EmptyState
                        icon={Smartphone}
                        title="Select a phone"
                        description="View properties and manage specifications"
                    />
                )}
            </div>

            {/* Edit/Add Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title={phones.find(p => p.id === editingPhone?.id) ? "Edit Phone" : "Add New Phone"}
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" action={ACTIONS.MPCS_PHONES_EDIT} onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                        <Button action={ACTIONS.MPCS_PHONES_SAVE} onClick={handeSave}>Save Changes</Button>
                    </>
                }
            >
                {editingPhone && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Name</label>
                                <input
                                    type="text"
                                    value={editingPhone.name}
                                    onChange={e => setEditingPhone({ ...editingPhone, name: e.target.value })}
                                    className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    placeholder="e.g. iPhone 15 Pro"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Brand</label>
                                <input
                                    type="text"
                                    value={editingPhone.brand}
                                    onChange={e => setEditingPhone({ ...editingPhone, brand: e.target.value })}
                                    className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    placeholder="e.g. Apple"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-slate-700">Specifications</label>
                                <Button size="sm" variant="secondary" action={ACTIONS.MPCS_PHONES_ADD} onClick={addSpec} type="button">
                                    <Plus className="w-3 h-3 mr-1" /> Add Spec
                                </Button>
                            </div>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500">
                                        <tr>
                                            <th className="px-3 py-2 font-medium">Key</th>
                                            <th className="px-3 py-2 font-medium">Label</th>
                                            <th className="px-3 py-2 font-medium">Value</th>
                                            <th className="w-8"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {editingPhone.specs.map((spec, i) => (
                                            <tr key={i}>
                                                <td className="p-2">
                                                    <input
                                                        className="w-full px-2 py-1 rounded border border-slate-200 text-xs font-mono"
                                                        value={spec.key}
                                                        placeholder="screen_size"
                                                        onChange={e => updateSpec(i, 'key', e.target.value)}
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        className="w-full px-2 py-1 rounded border border-slate-200"
                                                        value={spec.label}
                                                        placeholder="Screen Size"
                                                        onChange={e => updateSpec(i, 'label', e.target.value)}
                                                    />
                                                </td>
                                                <td className="p-2">
                                                    <input
                                                        className="w-full px-2 py-1 rounded border border-slate-200"
                                                        value={spec.value}
                                                        placeholder="6.1 inches"
                                                        onChange={e => updateSpec(i, 'value', e.target.value)}
                                                    />
                                                </td>
                                                <td className="p-2 text-center">
                                                    <button onClick={() => removeSpec(i)} className="text-slate-400 hover:text-red-500">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {editingPhone.specs.length === 0 && (
                                    <div className="p-4 text-center text-slate-400 text-sm">No specs added</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Confirmation */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Phone"
                size="sm"
                footer={
                    <>
                        <Button variant="secondary" action={ACTIONS.MPCS_PHONES_DELETE} onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                        <Button variant="danger" action={ACTIONS.MPCS_PHONES_DELETE} onClick={handleDelete}>Delete</Button>
                    </>
                }
            >
                <p className="text-slate-600">Are you sure you want to delete <span className="font-bold">{selectedPhone?.name}</span>? This action cannot be undone.</p>
            </Modal>
        </div>
    );
}
