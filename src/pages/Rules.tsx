import { useState } from 'react';
import { Scale, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/Table';
import { Badge } from '../components/Badge';
import { useAppStore } from '../store/appStore';
import type { Rule } from '../types/models';
import { useToast } from '../components/Toast';
import { ACTIONS } from '../actionMap';

export function Rules() {
    const { state, addRule, updateRule, deleteRule } = useAppStore();
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
            id: Math.random().toString(36).substring(2, 11),
            specKey: '',
            ruleType: 'higher_wins',
            updatedAt: new Date().toISOString()
        });
        setIsEditModalOpen(true);
    };

    const handleSave = () => {
        if (!editingRule || !editingRule.specKey) return;

        const ruleWithTimestamp = { ...editingRule, updatedAt: new Date().toISOString() };

        if (state.rules.find(r => r.id === editingRule.id)) {
            updateRule(ruleWithTimestamp);
            toast("Rule updated successfully", "success");
        } else {
            addRule(ruleWithTimestamp);
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
        <div className="flex-1 flex flex-col p-4 md:p-8 overflow-y-auto text-left">
            <div className="max-w-5xl mx-auto w-full space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Rule Map</h2>
                        <p className="text-slate-500">Define logic for how specs are compared</p>
                    </div>
                    <Button action={ACTIONS.MPCS_RULES_ADD} onClick={handleAdd}>
                        <Plus className="w-4 h-4 mr-2" /> Add Rule
                    </Button>
                </div>

                <Card className="p-0 overflow-hidden border border-slate-200">
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
                            {state.rules.map((rule) => (
                                <TableRow key={rule.id}>
                                    <TableCell className="font-mono text-slate-600">{rule.specKey}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={rule.ruleType === 'higher_wins' ? 'success' : rule.ruleType === 'lower_wins' ? 'warning' : 'outline'}
                                            className="capitalize"
                                        >
                                            {rule.ruleType.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-slate-500">{new Date(rule.updatedAt).toLocaleDateString()}</TableCell>
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
                            {state.rules.length === 0 && (
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
            </div>

            {/* Edit/Add Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title={state.rules.find((r) => r.id === editingRule?.id) ? "Edit Rule" : "Add New Rule"}
                footer={
                    <>
                        <Button variant="secondary" action={ACTIONS.MPCS_RULES_EDIT} onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                        <Button action={ACTIONS.MPCS_RULES_SAVE} onClick={handleSave}>Save Rule</Button>
                    </>
                }
            >
                {editingRule && (
                    <div className="space-y-4 text-left">
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
                                value={editingRule.ruleType}
                                onChange={e => setEditingRule({ ...editingRule, ruleType: e.target.value as 'higher_wins' | 'lower_wins' | 'manual' })}
                            >
                                <option value="higher_wins">Higher Value Wins (e.g. Battery, Storage)</option>
                                <option value="lower_wins">Lower Value Wins (e.g. Price, Weight)</option>
                                <option value="manual">Manual Decision</option>
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
                <p className="text-slate-600 text-left">Are you sure you want to delete this rule?</p>
            </Modal>
        </div>
    );
}
