import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Send } from 'lucide-react';

const StudentFeedback = () => {
  const { user } = useAuth();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: student } = await supabase.from('students').select('id').eq('user_id', user.id).maybeSingle();
      if (!student) return;
      setStudentId(student.id);
      const { data } = await supabase.from('feedback').select('*').eq('student_id', student.id).order('created_at', { ascending: false });
      if (data) setFeedbackList(data);
    };
    fetch();
  }, [user]);

  const handleSubmit = async () => {
    if (!studentId || !message.trim()) return;
    const { error } = await supabase.from('feedback').insert({ student_id: studentId, message: message.trim() });
    if (error) { toast({ variant: 'destructive', title: 'Error', description: error.message }); return; }
    toast({ title: 'Feedback sent!' });
    setMessage('');
    const { data } = await supabase.from('feedback').select('*').eq('student_id', studentId).order('created_at', { ascending: false });
    if (data) setFeedbackList(data);
  };

  return (
    <div className="page-container">
      <h1 className="dashboard-header">Feedback & Support</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Send Feedback</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Write your feedback or support request..."
            maxLength={1000}
            rows={4}
          />
          <Button onClick={handleSubmit} disabled={!message.trim()}>
            <Send size={16} className="mr-2" />Send
          </Button>
        </CardContent>
      </Card>

      <h2 className="text-lg font-semibold">Previous Feedback</h2>
      <div className="space-y-3">
        {feedbackList.map((f) => (
          <Card key={f.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm">{f.message}</p>
              <Badge variant={f.status === 'resolved' ? 'default' : 'secondary'}>{f.status}</Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{new Date(f.created_at).toLocaleString()}</p>
          </Card>
        ))}
        {feedbackList.length === 0 && (
          <p className="text-sm text-muted-foreground">No feedback submitted yet</p>
        )}
      </div>
    </div>
  );
};

export default StudentFeedback;
