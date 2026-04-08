import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const AdminFeedback = () => {
  const [feedback, setFeedback] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('feedback').select('*, students(full_name)').order('created_at', { ascending: false });
      if (data) setFeedback(data);
    };
    fetchData();
  }, []);

  return (
    <div className="page-container">
      <h1 className="dashboard-header">Student Feedback</h1>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {feedback.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{(f.students as any)?.full_name || '—'}</TableCell>
                <TableCell className="max-w-md truncate">{f.message}</TableCell>
                <TableCell>
                  <Badge variant={f.status === 'resolved' ? 'default' : 'secondary'}>{f.status}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{new Date(f.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
            {feedback.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No feedback</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default AdminFeedback;
