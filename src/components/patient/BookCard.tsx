import { BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BookCardProps {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
}

export default function BookCard({ id, title, description, imageUrl }: BookCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/learning/${id}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-200 flex flex-col h-full">
      <div className="relative h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center overflow-hidden">
        <img
          src={"https://media.springernature.com/full/springer-static/cover-hires/book/978-3-031-25519-9"}
          alt={""}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
          {title}
        </h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-grow">
          {description}
        </p>

        <button
          onClick={handleClick}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors mt-auto"
        >
          <BookOpen className="w-4 h-4" />
          Start Reading
        </button>
      </div>
    </div>
  );
}
