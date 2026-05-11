import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Props {
  onConfirm: () => void | Promise<void>;
  description: string;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export const ConfirmDeleteButton = ({
  onConfirm,
  description,
  title = 'Xác nhận xóa',
  confirmLabel = 'Xóa',
  cancelLabel = 'Hủy',
}: Props) => (
  <AlertDialog>
    <AlertDialogTrigger asChild>
      <Button variant="ghost" size="icon"><Trash2 size={14} className="text-destructive" /></Button>
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
        <AlertDialogAction onClick={() => onConfirm()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{confirmLabel}</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
