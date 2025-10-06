import { useState, useRef } from 'react';
import { X, Mic, Square, Upload, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type VoiceInputModalProps = {
  onClose: () => void;
  onDataExtracted: (data: any) => void;
};

export default function VoiceInputModal({ onClose, onDataExtracted }: VoiceInputModalProps) {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ru' | 'uz'>('en');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioBlob(file);
    }
  };

  const processAudio = async () => {
    if (!audioBlob) return;

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      formData.append('language', language);
      formData.append('llm_task', 'get_data');

      const response = await fetch('https://web-production-74e4.up.railway.app/transcribe-with-llm', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process audio');
      }

      const result = await response.json();
      console.log('Transcription result:', result);

      if (result.success && result.llm_text) {
        // Parse the LLM response
        const extractedData = JSON.parse(result.llm_text);
        console.log('Extracted data:', extractedData);

        // Pass the extracted data to parent component
        onDataExtracted(extractedData);
        onClose();
      } else {
        alert('Failed to extract data from audio. Please try again.');
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      alert('Failed to process audio. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-900">{t('voiceInput')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Language Selection */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              {t('selectLanguage')}
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'ru' | 'uz')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isRecording || isProcessing}
            >
              <option value="en">English</option>
              <option value="ru">Russian (Русский)</option>
              <option value="uz">Uzbek (O'zbek)</option>
            </select>
          </div>

          {/* Recording Controls */}
          <div className="space-y-4">
            <div className="text-center">
              {!isRecording && !audioBlob && (
                <button
                  onClick={startRecording}
                  disabled={isProcessing}
                  className="w-full py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl flex items-center justify-center gap-3 text-lg font-semibold hover:from-red-600 hover:to-pink-600 transition-all disabled:opacity-50"
                >
                  <Mic className="w-6 h-6" />
                  {t('startRecording')}
                </button>
              )}

              {isRecording && (
                <button
                  onClick={stopRecording}
                  className="w-full py-4 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl flex items-center justify-center gap-3 text-lg font-semibold hover:from-gray-800 hover:to-gray-900 transition-all animate-pulse"
                >
                  <Square className="w-6 h-6" />
                  {t('stopRecording')}
                </button>
              )}

              {audioBlob && !isRecording && (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-700 font-medium">✓ {t('audioRecorded')}</p>
                  </div>
                  <button
                    onClick={() => setAudioBlob(null)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {t('recordAgain')}
                  </button>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">{t('or')}</span>
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center gap-3 text-gray-700 font-medium hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer">
                <Upload className="w-5 h-5" />
                {t('uploadAudioFile')}
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isRecording || isProcessing}
                />
              </label>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 font-medium mb-2">
              {t('voiceInputInstructions')}
            </p>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li>{t('speakClearlyAndSlowly')}</li>
              <li>{t('includeAllRelevantHealthData')}</li>
              <li>{t('exampleVoiceInput')}</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {t('cancelButton')}
            </button>
            <button
              onClick={processAudio}
              disabled={!audioBlob || isProcessing}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  {t('processing')}
                </>
              ) : (
                t('processAudio')
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
