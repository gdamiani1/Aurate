import type { Metadata } from 'next';
import ConfirmClient from './ConfirmClient';

export const metadata: Metadata = {
  title: 'Confirming... | Mogster',
};

export default function ConfirmPage() {
  return <ConfirmClient />;
}
