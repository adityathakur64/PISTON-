import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Upload, CheckCircle, Flame, ShieldCheck } from 'lucide-react';
import { authService, dbService } from '../services/firebase';
import { calculateCarGR } from '../services/reputationService';

const RARITY_OPTIONS = [
  { value: 'common', label: 'Common (1.0x)', desc: 'Standard production cars, hot hatches' },
  { value: 'uncommon', label: 'Uncommon (1.2x)', desc: 'Performance trims, enthusiast favorites' },
  { value: 'rare', label: 'Rare (1.5x)', desc: 'Limited edition, legacy models, high-demand builds' },
  { value: 'exotic', label: 'Exotic (2.0x)', desc: 'Low-volume supercars, high-end classic restorations' },
  { value: 'hypercar', label: 'Hypercar (3.0x)', desc: 'Multi-million dollar builds, extreme limited track weapons' },
];

export default function UploadCar() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [description, setDescription] = useState('');
  const [rarity, setRarity] = useState<'common' | 'uncommon' | 'rare' | 'exotic' | 'hypercar'>('common');
  const [value, setValue] = useState(15000);
  const [buildQuality, setBuildQuality] = useState(5);
  const [isVerified, setIsVerified] = useState(false);
  
  // Modifications state
  const [modInput, setModInput] = useState('');
  const [modifications, setModifications] = useState<string[]>([]);
  
  // Photo state
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthChanges((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Calculate live score estimate
  const liveScoreEstimate = calculateCarGR({
    make,
    model,
    year: Number(year),
    description,
    modifications,
    rarity,
    value: Number(value),
    buildQuality: Number(buildQuality),
    isVerified,
    upvotes: 0, // start with 0 upvotes on upload
    photos: [],
  });


  const handleAddModification = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanMod = modInput.trim();
    if (cleanMod && !modifications.includes(cleanMod)) {
      setModifications([...modifications, cleanMod]);
      setModInput('');
    }
  };

  const handleRemoveModification = (index: number) => {
    setModifications(modifications.filter((_, i) => i !== index));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedPhotos(files);

      // Create previews
      const previews: string[] = [];
      files.forEach(file => {
        const url = URL.createObjectURL(file);
        previews.push(url);
      });
      setPhotoPreviews(previews);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!make || !model || !year || !description) {
      return setError('Please fill in all core specifications.');
    }
    if (selectedPhotos.length === 0) {
      return setError('Please upload at least one photo of your build.');
    }

    try {
      setLoading(true);
      setError('');
      
      await dbService.uploadCar(
        currentUser.uid,
        {
          make: make.trim(),
          model: model.trim(),
          year: Number(year),
          description: description.trim(),
          modifications,
          rarity,
          value: Number(value),
          buildQuality: Number(buildQuality),
          isVerified
        },
        selectedPhotos
      );
      
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to upload vehicle.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-xl md:text-2xl font-display font-black text-white uppercase tracking-tight">
          Upload New Build
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Add your vehicle specifications, select status rankings, and compute your Reputation score contribution.
        </p>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-900/50 text-red-400 text-xs px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Grid: Form (Left) & Live Estimator Widget (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Inputs Container */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Specs */}
          <div className="glass-panel rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-display font-extrabold text-zinc-400 uppercase tracking-widest border-b hairline pb-2">
              1. Build Specifications
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                  Make
                </label>
                <input
                  type="text"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  placeholder="e.g. Nissan, Porsche, Mazda"
                  className="block w-full px-3 py-2 field-surface rounded-lg text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                  Model
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. Skyline GT-R, RX-7"
                  className="block w-full px-3 py-2 field-surface rounded-lg text-sm text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                  Year
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  placeholder="2024"
                  min="1900"
                  max="2027"
                  className="block w-full px-3 py-2 field-surface rounded-lg text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                Description / Build Story
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is the story behind this build? Share your performance goals, weight reductions, engine tuning..."
                rows={3}
                className="block w-full px-3 py-2 field-surface rounded-lg text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Section 2: Photos */}
          <div className="glass-panel rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-display font-extrabold text-zinc-400 uppercase tracking-widest border-b hairline pb-2">
              2. Vehicle Photos
            </h2>

            <div className="relative border-2 border-dashed hairline hover:border-brand-orange/50 transition-colors rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-black/16">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload size={24} className="text-zinc-500 mb-2" />
              <span className="text-xs font-semibold text-zinc-300">Choose Photos or Drag Files Here</span>
              <span className="text-[10px] text-zinc-500 mt-1">Supports PNG, JPG (Max 5 files)</span>
            </div>

            {photoPreviews.length > 0 && (
              <div className="grid grid-cols-5 gap-2 pt-2">
                {photoPreviews.map((src, i) => (
                  <div key={i} className="aspect-square bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden relative">
                    <img src={src} className="w-full h-full object-cover" alt="Preview" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Mod Editor */}
          <div className="glass-panel rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-display font-extrabold text-zinc-400 uppercase tracking-widest border-b hairline pb-2">
              3. Modifications List
            </h2>

            <div className="flex gap-2">
              <input
                type="text"
                value={modInput}
                onChange={(e) => setModInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddModification())}
                placeholder="e.g. Ohlins Coilovers, Garrett G30 Turbo..."
                className="flex-1 px-3 py-2 field-surface rounded-lg text-sm text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleAddModification()}
                className="bg-bg-input hover:bg-zinc-800 border hairline hover:border-zinc-700 text-white p-2 rounded-lg transition-all"
              >
                <Plus size={18} />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {modifications.map((mod, index) => (
                <span
                  key={index}
                  className="text-xs bg-zinc-950 border border-zinc-800/80 px-2.5 py-1 rounded-full text-zinc-300 flex items-center gap-1.5"
                >
                  <span>{mod}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveModification(index)}
                    className="text-zinc-500 hover:text-red-400 font-bold"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              {modifications.length === 0 && (
                <span className="text-xs text-zinc-600 italic">No modifications listed yet.</span>
              )}
            </div>
          </div>

          {/* Section 4: Gamified Reputation Parameters */}
          <div className="glass-panel rounded-xl p-5 space-y-5">
            <h2 className="text-xs font-display font-extrabold text-zinc-400 uppercase tracking-widest border-b hairline pb-2">
              4. Gamification Scoring Factors
            </h2>

            {/* Rarity */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Vehicle Rarity Tier
              </label>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                {RARITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRarity(opt.value as any)}
                    className={`text-left border p-2.5 rounded-xl transition-all ${
                      rarity === opt.value
                        ? 'bg-orange-950/20 border-brand-orange text-brand-orange font-bold'
                        : 'bg-zinc-950/40 border-zinc-800/60 text-zinc-400 hover:bg-zinc-950/60'
                    }`}
                  >
                    <div className="text-xs font-display uppercase tracking-wide">{opt.value}</div>
                    <div className="text-[9px] opacity-75 font-sans mt-0.5 leading-tight">{opt.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Value & Quality Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Value Input */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                  Estimated Current Market Value (USD)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500 font-mono text-sm">
                    $
                  </span>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    min="500"
                    max="10000000"
                    step="500"
                    className="block w-full pl-8 pr-3 py-2 field-surface rounded-lg text-sm text-white focus:outline-none font-mono"
                  />
                </div>
                <p className="mt-1 text-[9px] text-zinc-500 leading-tight">
                  Logarithmic points apply to value to maintain platform fairness.
                </p>
              </div>

              {/* Build Quality Slider */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    Build Quality Rating
                  </label>
                  <span className="text-xs text-brand-orange font-display font-black tracking-wider bg-zinc-950 px-2 py-0.5 rounded border hairline">
                    {buildQuality} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={buildQuality}
                  onChange={(e) => setBuildQuality(Number(e.target.value))}
                  className="w-full accent-brand-orange bg-zinc-950 border border-zinc-800 rounded-lg h-2"
                />
                <div className="flex justify-between text-[9px] text-zinc-500 font-display mt-1">
                  <span>CLEAN / DAILY (1)</span>
                  <span>TUNED / TRACK WEAPON (10)</span>
                </div>
              </div>
            </div>

            {/* Verification Simulator */}
            <div className="flex items-center gap-3 pt-3 border-t border-zinc-800/60">
              <input
                type="checkbox"
                id="isVerified"
                checked={isVerified}
                onChange={(e) => setIsVerified(e.target.checked)}
                className="w-4 h-4 rounded text-brand-orange bg-zinc-950 border-zinc-800 focus:ring-brand-orange"
              />
              <label htmlFor="isVerified" className="text-xs text-zinc-300 font-semibold cursor-pointer select-none">
                Simulate PISTON Dyno & Document Verification <span className="text-brand-orange font-bold">(+1,500 GR Bonus!)</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-orange hover:bg-brand-orange-hover text-black font-display font-bold py-3 rounded-xl transition-all tracking-wider text-sm flex justify-center items-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <CheckCircle size={18} />
                <span>SUBMIT BUILD TO GARAGE</span>
              </>
            )}
          </button>
        </form>

        {/* Live Estimator Sidebar Widget */}
        <div className="space-y-6">
          <div className="glass-panel border-brand-orange/30 rounded-xl p-5 sticky top-24 space-y-4 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px accent-rail"></div>

            <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Flame size={18} className="text-brand-orange" />
              <h2 className="text-xs font-display font-black text-white uppercase tracking-wider">
                Garage Rep Estimator
              </h2>
            </div>

            <p className="text-[11px] text-zinc-400 leading-normal">
              Based on your build parameters, this vehicle will contribute the following reputation score:
            </p>

            <div className="space-y-3 pt-2">
              {/* Rarity Factor */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">Rarity Multiplier:</span>
                <span className="font-mono text-zinc-300 font-bold">
                  x{rarity === 'hypercar' ? '3.0' : rarity === 'exotic' ? '2.0' : rarity === 'rare' ? '1.5' : rarity === 'uncommon' ? '1.2' : '1.0'}
                </span>
              </div>

              {/* Value Factor */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">Value Component:</span>
                <span className="font-mono text-zinc-300">
                  {Math.floor(Math.log10(Math.max(1, value)) * 800).toLocaleString()} pts
                </span>
              </div>

              {/* Build Quality Factor */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">Build Quality Component:</span>
                <span className="font-mono text-zinc-300">{(buildQuality * 250).toLocaleString()} pts</span>
              </div>

              {/* Mods count */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">Modifications ({modifications.length}):</span>
                <span className="font-mono text-zinc-300">{(Math.min(15, modifications.length) * 150).toLocaleString()} pts</span>
              </div>

              {/* Verification Factor */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">Verification Bonus:</span>
                <span className="font-mono text-brand-orange font-bold">
                  {isVerified ? '+1,500 pts' : '0 pts'}
                </span>
              </div>

              {/* ESTIMATED TOTAL */}
              <div className="border-t border-zinc-800 pt-3 flex justify-between items-end">
                <span className="text-[10px] text-zinc-400 font-display font-extrabold uppercase tracking-widest">
                  Est. Score Contribution:
                </span>
                <span className="text-2xl font-display font-black text-brand-orange tracking-wider">
                  {liveScoreEstimate.toLocaleString()} <span className="text-xs text-zinc-400 font-bold">GR</span>
                </span>
              </div>
            </div>

            {/* Quick warning */}
            <div className="bg-zinc-950/60 border hairline p-3 rounded-xl text-[10px] text-zinc-500 leading-normal flex gap-2">
              <ShieldCheck size={14} className="text-brand-orange shrink-0 mt-0.5" />
              <span>
                Scores are verified by PISTON core algorithms. Spamming modifications is capped at 15 items to encourage meaningful listings.
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
