import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ImagePlus, Upload, X } from 'lucide-react';
import { authService, dbService } from '../services/firebase';

export default function UploadStory() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [caption, setCaption] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthChanges((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedMedia(file);
    setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
    setMediaPreview(URL.createObjectURL(file));
  };

  const clearMedia = () => {
    setSelectedMedia(null);
    setMediaPreview('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return setError('You must be signed in to upload a story.');
    if (!selectedMedia) return setError('Please choose story media.');

    try {
      setLoading(true);
      setError('');

      await dbService.uploadStory(
        currentUser.uid,
        {
          caption: caption.trim(),
          mediaType,
        },
        selectedMedia
      );

      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to upload story.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl animate-fadeIn space-y-6">
      <div>
        <h1 className="font-display text-xl font-black uppercase tracking-tight text-white md:text-2xl">
          Upload Story
        </h1>
        <p className="mt-1 text-xs text-zinc-500">
          Share a quick garage update separate from your vehicle posts.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/40 px-4 py-3 text-xs text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="glass-panel space-y-5 rounded-xl p-5">
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Story Media
            </label>
            {mediaPreview ? (
              <div className="relative overflow-hidden rounded-xl bg-black">
                {mediaType === 'video' ? (
                  <video src={mediaPreview} className="aspect-[9/14] w-full object-cover" controls />
                ) : (
                  <img src={mediaPreview} alt="Story preview" className="aspect-[9/14] w-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={clearMedia}
                  className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-lg bg-black/70 text-zinc-200 transition hover:bg-red-950/85 hover:text-red-300"
                  title="Remove media"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div className="relative flex aspect-[9/14] flex-col items-center justify-center rounded-xl border-2 border-dashed hairline bg-black/16 text-center transition hover:border-brand-orange/50">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleMediaChange}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <ImagePlus size={30} className="mb-3 text-zinc-500" />
                <span className="text-xs font-semibold text-zinc-300">Choose Story Media</span>
                <span className="mt-1 text-[10px] text-zinc-500">Vertical photos or videos work best</span>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Caption
              <span className="ml-1 text-zinc-600">(optional)</span>
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What is happening right now?"
              rows={4}
              className="field-surface block w-full rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
            />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="glass-panel rounded-xl p-5">
            <div className="flex items-center gap-2 border-b hairline pb-3">
              <Upload size={17} className="text-brand-orange" />
              <h2 className="text-xs font-display font-black uppercase tracking-wider text-white">
                Story Upload
              </h2>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-zinc-400">
              Stories appear in the story tray only. They do not become vehicle posts and do not change garage reputation.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-orange py-3 text-sm font-display font-bold tracking-wider text-black transition hover:bg-brand-orange-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
            ) : (
              <>
                <CheckCircle size={18} />
                <span>UPLOAD STORY</span>
              </>
            )}
          </button>
        </aside>
      </form>
    </div>
  );
}
