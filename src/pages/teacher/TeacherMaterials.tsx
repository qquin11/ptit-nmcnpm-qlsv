import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText } from 'lucide-react';

const TeacherMaterials = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ class_id: '', title: '', file: null as File | null });
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: teacher } = await supabase.from('teachers').select('id').eq('user_id', user.id).maybeSingle();
      if (!teacher) return;
      const { data: cls } = await supabase.from('classes').select('id, class_name').eq('teacher_id', teacher.id);
      if (cls) setClasses(cls);
      const classIds = cls?.map(c => c.id) || [];
      if (classIds.length > 0) {
        const { data: mats } = await supabase.from('materials').select('*, classes(class_name)').in('class_id', classIds).order('upload_date', { ascending: false });
        if (mats) setMaterials(mats);
      }
    };
    fetch();
  }, [user]);

  const handleUpload = async () => {
    if (!form.class_id || !form.title.trim()) {
      toast({ variant: 'destructive', title: 'Fill all fields' }); return;
    }
    let file_url = null;
    if (form.file) {
      const path = `${form.class_id}/${Date.now()}_${form.file.name}`;
      const { error } = await supabase.storage.from('materials').upload(path, form.file);
      if (error) { toast({ variant: 'destructive', title: 'Upload failed', description: error.message }); return; }
      const { data: urlData } = supabase.storage.from('materials').getPublicUrl(path);
      file_url = urlData.publicUrl;
    }
    await supabase.from('materials').insert({ class_id: form.class_id, title: form.title.trim(), file_url });
    toast({ title: 'Material uploaded' });
    setDialogOpen(false);
    setForm({ class_id: '', title: '', file: null });
    // Refresh
    window.location.reload();
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <h1 className="dashboard-header">Course Materials</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Upload size={16} className="mr-2" />Upload</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Upload Material</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Class</Label>
                <Select value={form.class_id} onValueChange={v => setForm({ ...form, class_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.class_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Title</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>File</Label><Input type="file" onChange={e => setForm({ ...form, file: e.target.files?.[0] || null })} /></div>
              <Button onClick={handleUpload} className="w-full">Upload</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>File</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.title}</TableCell>
                <TableCell>{(m.classes as any)?.class_name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{new Date(m.upload_date).toLocaleDateString()}</TableCell>
                <TableCell>
                  {m.file_url ? (
                    <a href={m.file_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      <FileText size={14} />Download
                    </a>
                  ) : '—'}
                </TableCell>
              </TableRow>
            ))}
            {materials.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No materials</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default TeacherMaterials;
