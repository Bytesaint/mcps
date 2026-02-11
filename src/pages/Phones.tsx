import { useState } from 'react';
import { Smartphone, Plus, Pencil, Trash2, Search, X, Image as ImageIcon, Upload } from 'lucide-react';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/Table';
import { EmptyState } from '../components/EmptyState';
import { useAppStore } from '../store/appStore';
import type { Phone, PhoneSpec as Spec } from '../types/models';
import { useToast } from '../components/Toast';
import { ACTIONS } from '../actionMap';
import { cn } from '../lib/utils';

export function Phones() {
    const { state, addPhone, updatePhone, deletePhone } = useAppStore();
    const { phones } = state;
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
            id: Math.random().toString(36).substring(2, 11),
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
            specs: [...editingPhone.specs, { id: Math.random().toString(36).substring(2, 11), key: '', label: '', value: '' }]
        });
    };

    const removeSpec = (index: number) => {
        if (!editingPhone) return;
        const newSpecs = [...editingPhone.specs];
        newSpecs.splice(index, 1);
        setEditingPhone({ ...editingPhone, specs: newSpecs });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editingPhone) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setEditingPhone({
                ...editingPhone,
                image: {
                    name: file.name,
                    dataUrl: reader.result as string
                }
            });
            toast("Image uploaded", "success");
        };
        reader.readAsDataURL(file);
    };

    const handleImageRemove = () => {
        if (!editingPhone) return;
        setEditingPhone({ ...editingPhone, image: undefined });
        toast("Image removed", "info");
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 p-4 md:p-8 overflow-y-auto lg:overflow-hidden text-left">
            <div className="flex flex-col lg:flex-row gap-6 lg:h-full min-h-0">
                {/* List Panel */}
                <div className="w-full lg:w-1/3 flex flex-col gap-4 min-h-[400px] lg:min-h-0">
                    <div className="flex items-center justify-between shrink-0">
                        <h2 className="text-lg font-semibold text-slate-800">Phones directory</h2>
                        <Button size="sm" action={ACTIONS.MPCS_PHONES_ADD} onClick={handleAdd}>
                            <Plus className="w-4 h-4 mr-2" /> Add
                        </Button>
                    </div>

                    <div className="relative shrink-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search phones..."
                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>

                    <div className="flex-1 lg:overflow-y-auto bg-white rounded-lg border border-slate-200 shadow-sm">
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
                                        <div className="min-w-0">
                                            <p className="font-medium text-slate-900 truncate">{phone.name}</p>
                                            <p className="text-xs text-slate-500">{phone.brand} • {phone.specs.length} specs</p>
                                        </div>
                                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 overflow-hidden border border-slate-200">
                                            {phone.image ? (
                                                <img src={phone.image.dataUrl} alt={phone.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Smartphone className="w-4 h-4" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Details Panel */}
                <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col min-h-[500px] lg:min-h-0 overflow-hidden text-left">
                    {selectedPhone ? (
                        <>
                            <div className="p-6 border-b border-slate-100 shrink-0">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 overflow-hidden border border-slate-200 shadow-sm">
                                                {selectedPhone.image ? (
                                                    <img src={selectedPhone.image.dataUrl} alt={selectedPhone.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Smartphone className="w-8 h-8" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h2 className="text-xl font-bold text-slate-900 truncate">{selectedPhone.name}</h2>
                                                <p className="text-sm text-slate-500">{selectedPhone.brand}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <Button variant="secondary" action={ACTIONS.MPCS_PHONES_EDIT} onClick={() => handleEdit(selectedPhone)}>
                                            <Pencil className="w-4 h-4 mr-2" /> Edit
                                        </Button>
                                        <Button variant="danger" action={ACTIONS.MPCS_PHONES_DELETE} onClick={() => setIsDeleteModalOpen(true)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 overflow-y-auto flex-1 min-h-0">
                                <h3 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">Specifications</h3>
                                <div className="border rounded-lg overflow-hidden">
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
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center p-8">
                            <EmptyState
                                icon={Smartphone}
                                title="Select a phone"
                                description="View properties and manage specifications"
                            />
                        </div>
                    )}
                </div>
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
                    <div className="space-y-6 text-left">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-slate-700">Phone Image</label>
                            <div className="flex items-start gap-4">
                                <div className="w-24 h-24 rounded-lg bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 overflow-hidden relative group">
                                    {editingPhone.image ? (
                                        <>
                                            <img src={editingPhone.image.dataUrl} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button
                                                    onClick={handleImageRemove}
                                                    data-action={ACTIONS.MPCS_PHONES_IMAGE_REMOVE}
                                                    className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <ImageIcon className="w-8 h-8 opacity-20" />
                                    )}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <label className="cursor-pointer">
                                            <div
                                                className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 shadow-sm"
                                                data-action={ACTIONS.MPCS_PHONES_IMAGE_UPLOAD}
                                            >
                                                <Upload className="w-3.5 h-3.5" />
                                                {editingPhone.image ? 'Change Image' : 'Upload Image'}
                                            </div>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                            />
                                        </label>
                                        {editingPhone.image && (
                                            <button
                                                onClick={handleImageRemove}
                                                className="text-xs text-red-500 hover:underline"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-500 leading-relaxed">
                                        JPEG, PNG or WebP. Store locally as base64.<br />
                                        Recommend 1000x1000px for best preview quality.
                                    </p>
                                </div>
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
                <p className="text-slate-600 text-left">Are you sure you want to delete <span className="font-bold">{selectedPhone?.name}</span>? This action cannot be undone.</p>
            </Modal>
        </div>
    );
}
