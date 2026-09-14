import React from 'react';
import StudentDetailClient from './StudentDetailClient';

export function generateStaticParams() {
  return [{ studentId: 'default' }];
}

export default function StudentDetailsPage() {
  return <StudentDetailClient />;
}
