import { useRef, useState } from "react";
import useKeyBoardSound from "../hooks/useKeyBoardSound";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";
import { ImageIcon, SendIcon, XIcon, MicIcon, SquareIcon } from "lucide-react";

function MessageInput() {
  const { playRandomKeyStrokeSound } = useKeyBoardSound();
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioPreview, setAudioPreview] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const fileInputRef = useRef(null);

  const { sendMessage, isSoundEnabled } = useChatStore();

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview && !videoPreview && !audioPreview) return;
    if (isSoundEnabled) playRandomKeyStrokeSound();

    sendMessage({
      text: text.trim(),
      image: imagePreview,
      video: videoPreview,
      audio: audioPreview,
    });

    setText("");
    setImagePreview(null);
    setVideoPreview(null);
    setAudioPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setVideoPreview(null);
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith("video/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreview(reader.result);
        setImagePreview(null);
      };
      reader.readAsDataURL(file);
    } else {
      toast.error("Please select an image or video");
    }
  };

  const removeMedia = () => {
    setImagePreview(null);
    setVideoPreview(null);
    setAudioPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioPreview(reader.result);
          setImagePreview(null);
          setVideoPreview(null);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      toast.error("Microphone permission needed");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <div className="p-4 border-t border-slate-700/50">
      {/* Image Preview */}
      {imagePreview && (
        <div className="max-w-3xl mx-auto mb-3 flex items-center">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-slate-700"
            />
            <button
              onClick={removeMedia}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-200 hover:bg-slate-700"
              type="button"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Video Preview */}
      {videoPreview && (
        <div className="max-w-3xl mx-auto mb-3 flex items-center">
          <div className="relative">
            <video
              src={videoPreview}
              className="w-32 h-20 object-cover rounded-lg border border-slate-700"
              controls
            />
            <button
              onClick={removeMedia}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-200 hover:bg-slate-700"
              type="button"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {audioPreview && (
        <div className="max-w-3xl mx-auto mb-3 flex items-center gap-2">
          <audio src={audioPreview} controls className="h-10" />
          <button type="button" onClick={removeMedia}>
            <XIcon className="w-4 h-4 text-slate-200" />
          </button>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex space-x-4">
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            isSoundEnabled && playRandomKeyStrokeSound();
          }}
          className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg py-2 px-4"
          placeholder="Type your message..."
        />

        <input
          type="file"
          accept="image/*,video/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Image button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`bg-slate-800/50 text-slate-400 hover:text-slate-200 rounded-lg px-4 transition-colors ${imagePreview || videoPreview ? "text-cyan-500" : ""
            }`}
        >
          <ImageIcon className="w-5 h-5" />
        </button>

        {/* Mic button */}
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          className={`bg-slate-800/50 rounded-lg px-4 ${isRecording ? "text-red-500" : "text-slate-400 hover:text-slate-200"
            }`}
        >
          {isRecording ? <SquareIcon className="w-5 h-5" /> : <MicIcon className="w-5 h-5" />}
        </button>

        {/* Send button */}
        <button
          type="submit"
          disabled={!text.trim() && !imagePreview && !videoPreview && !audioPreview}
          className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg px-4 py-2 font-medium hover:from-cyan-600 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}

export default MessageInput;