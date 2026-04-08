import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const ManageSchedules = () => {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ class_id: '', day_of_week: '', start_time: '', end_time: '', room: '' });
  const { toast } = useToast();

  const fetchData = async () => {
    const [sc, cl] = await Promise.all([
      supabase.from('schedules').select('*, classes(class_name)').order('day_of_week'),
      supabase.from('classes').select('id, class_name'),
    ]);
    if (sc.data) setSchedules(sc.data);
    if (cl.data) setClasses(cl.data);
  };

  useEffect(() => { fetchData(); }, []);
  const resetForm = () => { setForm({ class_id: '', day_of_week: '', start_time: '', end_time: '', room: '' }); setEditing(null); };

  const handleSave = async () => {
    if (!form.class_id || !form.day_of_week || !form.start_time || !form.end_time) {
      toast({ variant: 'destructive', title: 'Fill required fields' }); return;
    }
    const payload = { class_id: form.class_id, day_of_week: form.day_of_week, start_time: form.start_time, end_time: form.end_time, room: form.room.trim() || null };
    if (editing) {
      await supabase.from('schedules').update(payload).eq('id', editing.id);
      toast({ title: 'Updated' });
    } else {
      await supabase.from('schedules').insert(payload);
      toast({ title: 'Created' });
    }
    setDialogOpen(false); resetForm(); fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete?')) return;
    await supabase.from('schedules').delete().eq('id', id);
    fetchData();
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <h1 className="dashboard-header">Manage Schedules</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button><Plus size={16} className="mr-2" />Add Schedule</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Schedule</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Class</Label>
                <Select value={form.class_id} onValueChange={v => setForm({ ...form, class_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Day</Label>
                <Select value={form.day_of_week} onValueChange={v => setForm({ ...form, day_of_week: v })}>
                  <SelectTrigger><SelectValue placeholder="Select day" /></SelectTrigger>
                  <SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Start</Label><Input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} /></div>
                <div><Label>End</Label><Input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} /></div>
              </div>
              <div><Label>Room</Label><Input value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} /></div>
              <Button onClick={handleSave} className="w-full">{editing ? 'Update' : 'Create'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class</TableHead>
              <TableHead>Day</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Room</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{(s.classes as any)?.class_name || '—'}</TableCell>
                <TableCell>{s.day_of_week}</TableCell>
                <TableCell>{s.start_time} – {s.end_time}</TableCell>
                <TableCell>{s.room || '—'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(s); setForm({ class_id: s.class_id, day_of_week: s.day_of_week, start_time: s.start_time, end_time: s.end_time, room: s.room || '' }); setDialogOpen(true); }}><Pencil size={14} /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}><Trash2 size={14} className="text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {schedules.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No schedules</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default ManageSchedules;
