import { BookOpen } from 'lucide-react';
import BookCard from './BookCard';

const educationalBooks = [
  {
    id: '1',
    title: 'Type 1 Diabetes Patient School',
    description: 'Complete guide on blood sugar control, insulin therapy, and proper nutrition.',
    imageUrl: 'https://via.placeholder.com/150x200/3A86FF/FFFFFF?text=Diabetes+1'
  },
  {
    id: '2',
    title: 'Physical Activity Basics',
    description: 'How to improve your health through daily exercise routines.',
    imageUrl: 'https://via.placeholder.com/150x200/48BB78/FFFFFF?text=Exercise'
  },
  {
    id: '3',
    title: 'Proper Nutrition & Diet',
    description: 'Planning balanced meals to control blood sugar levels.',
    imageUrl: 'https://via.placeholder.com/150x200/F59E0B/FFFFFF?text=Nutrition'
  },
  {
    id: '4',
    title: 'Insulin Administration Guide',
    description: 'How to properly and safely administer insulin injections.',
    imageUrl: 'https://via.placeholder.com/150x200/8B5CF6/FFFFFF?text=Insulin'
  },
];

export default function LearningSection() {
  return (
    <div className="space-y-6">
      {/* Books Grid */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <BookOpen className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Available Books</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {educationalBooks.map((book) => (
            <BookCard
              key={book.id}
              id={book.id}
              title={book.title}
              description={book.description}
              imageUrl={book.imageUrl}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
