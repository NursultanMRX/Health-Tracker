import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Import the local PDF file
import samplePdf from '../../book/КД 1 тур беморлар учун атлас.PDF';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function BookReadingPage() {
  const navigate = useNavigate();
  const { bookId } = useParams();
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
  }

  function onDocumentLoadError(error: Error) {
    console.error('Error loading PDF:', error);
    setLoading(false);
  }

  function goToPrevPage() {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  }

  function goToNextPage() {
    setPageNumber((prev) => Math.min(prev + 1, numPages));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>

            <h1 className="text-xl font-semibold text-gray-800">
              Reading Book #{bookId}
            </h1>

            <div className="w-24" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Navigation Controls */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="px-5 py-2.5 bg-white rounded-lg shadow-sm border border-gray-200">
            <span className="text-sm font-semibold text-gray-700">
              {loading ? 'Loading...' : `Page ${pageNumber} of ${numPages}`}
            </span>
          </div>

          <button
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors shadow-sm"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* PDF Viewer */}
        <div className="flex justify-center">
          <div className="bg-white rounded-lg shadow-lg p-4">
            {loading && (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto mb-3"></div>
                  <p className="text-gray-600">Loading...</p>
                </div>
              </div>
            )}

            <Document
              file={samplePdf}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center h-96">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
                </div>
              }
              error={
                <div className="flex items-center justify-center h-96 bg-red-50 rounded p-8">
                  <div className="text-center">
                    <p className="text-red-600 font-semibold mb-2">Failed to load PDF</p>
                    <p className="text-sm text-gray-600">Please try again</p>
                  </div>
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={1.3}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </Document>
          </div>
        </div>
      </main>
    </div>
  );
}
