import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

interface Teacher {
  id: string;
  teacher_code: string;
  full_name: string;
  department: string | null;
  phone: string | null;
  user_id: string;
}

const ManageTeachers = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [form, setForm] = useState({ teacher_code: '', full_name: '', department: '', phone: '' });
  const { toast } = useToast();

  const fetch = async () => {
    const { data } = await supabase.from('teachers').select('*').order('created_at', { ascending: false });
    if (data) setTeachers(data);
  };

  useEffect(() => { fetch(); }, []);

  const resetForm = () => { setForm({ teacher_code: '', full_name: '', department: '', phone: '' }); setEditing(null); };

  const handleEdit = (t: Teacher) => {
    setEditing(t);
    setForm({ teacher_code: t.teacher_code, full_name: t.full_name, department: t.department || '', phone: t.phone || '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.teacher_code.trim() || !form.full_name.trim()) {
      toast({ variant: 'destructive', title: 'Validation', description: 'Code and name required' });
      return;
    }
    if (editing) {
      const { error } = await supabase.from('teachers').update({
        teacher_code: form.teacher_code.trim(),
        full_name: form.full_name.trim(),
        department: form.department.trim() || null,
        phone: form.phone.trim() || null,
      }).eq('id', editing.id);
      if (error) { toast({ variant: 'destructive', title: 'Error', description: error.message }); return; }
      toast({ title: 'Teacher updated' });
    }
    setDialogOpen(false);
    resetForm();
    fetch();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this teacher?')) return;
    await supabase.from('teachers').delete().eq('id', id);
    toast({ title: 'Teacher deleted' });
    fetch();
  };

  const filtered = teachers.filter(t =>
    t.full_name.toLowerCase().includes(search.toLowerCase()) || t.teacher_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <h1 className="dashboard-header">Manage Teachers</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus size={16} className="mr-2" />Add Teacher</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Edit Teacher' : 'Add Teacher'}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Teacher Code</Label><Input value={form.teacher_code} onChange={e => setForm({ ...form, teacher_code: e.target.value })} /></div>
              <div><Label>Full Name</Label><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
              <div><Label>Department</Label><Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <Button onClick={handleSave} className="w-full">{editing ? 'Update' : 'Create'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search teachers..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono text-sm">{t.teacher_code}</TableCell>
                <TableCell className="font-medium">{t.full_name}</TableCell>
                <TableCell>{t.department || '—'}</TableCell>
                <TableCell>{t.phone || '—'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(t)}><Pencil size={14} /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}><Trash2 size={14} className="text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No teachers found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default ManageTeachers;
