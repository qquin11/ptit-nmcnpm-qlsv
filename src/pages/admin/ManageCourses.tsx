import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const ManageCourses = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ course_code: '', course_name: '', credits: '3', department: '' });
  const { toast } = useToast();

  const fetchData = async () => {
    const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false });
    if (data) setCourses(data);
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => { setForm({ course_code: '', course_name: '', credits: '3', department: '' }); setEditing(null); };

  const handleEdit = (c: any) => {
    setEditing(c);
    setForm({ course_code: c.course_code, course_name: c.course_name, credits: String(c.credits), department: c.department || '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.course_code.trim() || !form.course_name.trim()) {
      toast({ variant: 'destructive', title: 'Validation', description: 'Code and name required' });
      return;
    }
    const payload = {
      course_code: form.course_code.trim(),
      course_name: form.course_name.trim(),
      credits: parseInt(form.credits) || 3,
      department: form.department.trim() || null,
    };

    if (editing) {
      const { error } = await supabase.from('courses').update(payload).eq('id', editing.id);
      if (error) { toast({ variant: 'destructive', title: 'Error', description: error.message }); return; }
      toast({ title: 'Course updated' });
    } else {
      const { error } = await supabase.from('courses').insert(payload);
      if (error) { toast({ variant: 'destructive', title: 'Error', description: error.message }); return; }
      toast({ title: 'Course created' });
    }
    setDialogOpen(false);
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this course?')) return;
    await supabase.from('courses').delete().eq('id', id);
    toast({ title: 'Course deleted' });
    fetchData();
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <h1 className="dashboard-header">Manage Courses</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus size={16} className="mr-2" />Add Course</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Edit Course' : 'Add Course'}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Course Code</Label><Input value={form.course_code} onChange={e => setForm({ ...form, course_code: e.target.value })} /></div>
              <div><Label>Course Name</Label><Input value={form.course_name} onChange={e => setForm({ ...form, course_name: e.target.value })} /></div>
              <div><Label>Credits</Label><Input type="number" value={form.credits} onChange={e => setForm({ ...form, credits: e.target.value })} /></div>
              <div><Label>Department</Label><Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></div>
              <Button onClick={handleSave} className="w-full">{editing ? 'Update' : 'Create'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Department</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-sm">{c.course_code}</TableCell>
                <TableCell className="font-medium">{c.course_name}</TableCell>
                <TableCell>{c.credits}</TableCell>
                <TableCell>{c.department || '—'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}><Pencil size={14} /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 size={14} className="text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {courses.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No courses found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default ManageCourses;
