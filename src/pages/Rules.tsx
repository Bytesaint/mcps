import React, { useState } from 'react';
import { Scale, Plus, Pencil, Trash2, Search, AlertCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/Table';
import { Badge } from '../components/Badge';
import { useMock, Rule } from '../mock/MockContext';
import { useToast } from '../components/Toast';
import { ACTIONS } from '../actionMap';

export function Rules() {
    const { rules, addRule, updateRule, deleteRule } = useMock();
    const { toast } = useToast();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<Rule | null>(null);
    const [deleteRuleId, setDeleteRuleId] = useState<string | null>(null);

    const handleEdit = (rule: Rule) => {
        setEditingRule({ ...rule });
        setIsEditModalOpen(true);
    };

    const handleAdd = () => {
        setEditingRule({
            id: Math.random().toString(36).substr(2, 9),
            specKey: '',
            type: 'HIGHER_WINS',
            lastUpdated: new Date().toISOString().split('T')[0]
        });
        setIsEditModalOpen(true);
    };

    const handleSave = () => {
        if (!editingRule || !editingRule.specKey) return;

        if (rules.find(r => r.id === editingRule.id)) {
            updateRule({ ...editingRule, lastUpdated: new Date().toISOString().split('T')[0] });
            toast("Rule updated successfully", "success");
        } else {
            addRule(editingRule);
            toast("Rule added successfully", "success");
        }
        setIsEditModalOpen(false);
    };

    const confirmDelete = (id: string) => {
        setDeleteRuleId(id);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = () => {
        if (deleteRuleId) {
            deleteRule(deleteRuleId);
            setDeleteRuleId(null);
            setIsDeleteModalOpen(false);
            toast("Rule deleted", "info");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Rule Map</h2>
                    <p className="text-slate-500">Define logic for how specs are compared</p>
                </div>
                <Button action={ACTIONS.MPCS_RULES_ADD} onClick={handleAdd}>
                    <Plus className="w-4 h-4 mr-2" /> Add Rule
                </Button>
            </div>

            <Card className="p-0 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Spec Key</TableHead>
                            <TableHead>Comparison Logic</TableHead>
                            <TableHead>Last Updated</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rules.map((rule) => (
                            <TableRow key={rule.id}>
                                <TableCell className="font-mono text-slate-600">{rule.specKey}</TableCell>
                                <TableCell>
                                    <Badge
                                        variant={rule.type === 'HIGHER_WINS' ? 'success' : rule.type === 'LOWER_WINS' ? 'warning' : 'outline'}
                                        className="capitalize"
                                    >
                                        {rule.type.replace('_', ' ').toLowerCase()}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-slate-500">{rule.lastUpdated}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="secondary" size="sm" className="h-8 w-8 p-0" action={ACTIONS.MPCS_RULES_EDIT} onClick={() => handleEdit(rule)}>
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button variant="danger" size="sm" className="h-8 w-8 p-0" action={ACTIONS.MPCS_RULES_DELETE} onClick={() => confirmDelete(rule.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {rules.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-12">
                                    <div className="flex flex-col items-center justify-center text-slate-500">
                                        <Scale className="w-8 h-8 mb-2 opacity-50" />
                                        <p>No rules defined yet</p>
                                        <Button variant="secondary" size="sm" className="mt-4" action={ACTIONS.MPCS_RULES_ADD} onClick={handleAdd}>
                                            Create your first rule
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Edit/Add Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title={rules.find(r => r.id === editingRule?.id) ? "Edit Rule" : "Add New Rule"}
                footer={
                    <>
                        <Button variant="secondary" action={ACTIONS.MPCS_RULES_EDIT} onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                        <Button action={ACTIONS.MPCS_RULES_SAVE} onClick={handleSave}>Save Rule</Button>
                    </>
                }
            >
                {editingRule && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Spec Key</label>
                            <Input
                                value={editingRule.specKey}
                                onChange={e => setEditingRule({ ...editingRule, specKey: e.target.value })}
                                placeholder="e.g. battery_capacity"
                            />
                            <p className="text-xs text-slate-500 mt-1">Must match the key used in phone specs.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Comparison Logic</label>
                            <select
                                className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                                value={editingRule.type}
                                onChange={e => setEditingRule({ ...editingRule, type: e.target.value as any })}
                            >
                                <option value="HIGHER_WINS">Higher Value Wins (e.g. Battery, Storage)</option>
                                <option value="LOWER_WINS">Lower Value Wins (e.g. Price, Weight)</option>
                                <option value="MANUAL">Manual Decision</option>
                            </select>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Delete Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Rule"
                size="sm"
                footer={
                    <>
                        <Button variant="secondary" action={ACTIONS.MPCS_RULES_DELETE} onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                        <Button variant="danger" action={ACTIONS.MPCS_RULES_DELETE} onClick={handleDelete}>Delete</Button>
                    </>
                }
            >
                <p className="text-slate-600">Are you sure you want to delete this rule?</p>
            </Modal>
        </div>
    );
}
