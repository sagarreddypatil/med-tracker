import { useState, useEffect } from 'preact/hooks';

const LOGS_KEY = 'med_tracker_logs';
const MEDS_KEY = 'med_tracker_medications';
const uuid = () => crypto.randomUUID();

const ICONS = {
    pill: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M19.73 4.27a5.33 5.33 0 00-7.54 0L4.27 12.19a5.33 5.33 0 007.54 7.54l7.92-7.92a5.33 5.33 0 000-7.54zm-1.41 6.13l-3.96 3.96-4.24-4.24 3.96-3.96a2.67 2.67 0 013.77 0l.47.47a2.67 2.67 0 010 3.77z" />
        </svg>
    ),
    tablet: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <circle cx="12" cy="12" r="9" />
            <line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" strokeWidth="1" opacity="0.3" />
        </svg>
    ),
};

const ICON_NAMES = Object.keys(ICONS);

const COLORS = [
    { name: 'red', hex: '#ef4444' },
    { name: 'orange', hex: '#f97316' },
    { name: 'amber', hex: '#f59e0b' },
    { name: 'yellow', hex: '#eab308' },
    { name: 'lime', hex: '#84cc16' },
    { name: 'green', hex: '#22c55e' },
    { name: 'teal', hex: '#14b8a6' },
    { name: 'cyan', hex: '#06b6d4' },
    { name: 'blue', hex: '#3b82f6' },
    { name: 'indigo', hex: '#6366f1' },
    { name: 'violet', hex: '#8b5cf6' },
    { name: 'purple', hex: '#a855f7' },
    { name: 'pink', hex: '#ec4899' },
    { name: 'rose', hex: '#f43f5e' },
];

const MedIcon = ({ icon, color, size = 32 }) => {
    const colorData = COLORS.find(c => c.name === color) || COLORS[8];
    return (
        <div
            className="rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
                width: size,
                height: size,
                backgroundColor: colorData.hex + '20'
            }}
        >
            <div style={{ width: size * 0.6, height: size * 0.6, color: colorData.hex }}>
                {ICONS[icon] || ICONS.pill}
            </div>
        </div>
    );
};

const Modal = ({ onClose, children }) => (
    <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50"
        onClick={onClose}
    >
        <div
            className="bg-zinc-900 rounded-2xl w-full max-w-sm border border-zinc-800"
            onClick={e => e.stopPropagation()}
        >
            {children}
        </div>
    </div>
);

const ConfirmDialog = ({ title, description, onConfirm, onCancel, confirmText = "Delete", confirmClass = "bg-red-600 hover:bg-red-500" }) => (
    <Modal onClose={onCancel}>
        <div className="px-5 py-5 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </div>
            <h3 className="text-lg font-medium mb-1">{title}</h3>
            <p className="text-zinc-500 text-sm">{description}</p>
        </div>
        <div className="px-5 pb-5 flex gap-3">
            <button
                onClick={onCancel}
                className="flex-1 py-3 rounded-xl border border-zinc-700/50 text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all font-medium"
            >
                Cancel
            </button>
            <button
                onClick={onConfirm}
                className={`flex-1 py-3 rounded-xl text-white font-medium transition-all ${confirmClass}`}
            >
                {confirmText}
            </button>
        </div>
    </Modal>
);

export default function MedicationTracker() {
    const [logs, setLogs] = useState([]);
    const [medications, setMedications] = useState([]);
    const [view, setView] = useState('home');
    const [showTimeModal, setShowTimeModal] = useState(false);
    const [pendingMed, setPendingMed] = useState(null);
    const [logTime, setLogTime] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteMedTarget, setDeleteMedTarget] = useState(null);
    const [editingMed, setEditingMed] = useState(null);
    const [medName, setMedName] = useState('');
    const [medDosage, setMedDosage] = useState('');
    const [medIcon, setMedIcon] = useState('pill');
    const [medColor, setMedColor] = useState('blue');

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric'
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    useEffect(() => {
        const storedLogs = localStorage.getItem(LOGS_KEY);
        if (storedLogs) {
            const allLogs = JSON.parse(storedLogs);
            const todayLogs = allLogs
                .filter(log => new Date(log.timestamp) >= todayStart)
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setLogs(todayLogs);
        }

        const storedMeds = localStorage.getItem(MEDS_KEY);
        if (storedMeds) {
            setMedications(JSON.parse(storedMeds));
        }
    }, []);

    const saveLogs = (newLogs) => {
        const stored = localStorage.getItem(LOGS_KEY);
        const allLogs = stored ? JSON.parse(stored) : [];
        const oldLogs = allLogs.filter(log => new Date(log.timestamp) < todayStart);
        localStorage.setItem(LOGS_KEY, JSON.stringify([...oldLogs, ...newLogs]));
    };

    const saveMedications = (meds) => {
        localStorage.setItem(MEDS_KEY, JSON.stringify(meds));
    };

    const deleteLog = (id) => {
        const updatedLogs = logs.filter(log => log.id !== id);
        setLogs(updatedLogs);
        saveLogs(updatedLogs);
    };

    const openAddMed = () => {
        setEditingMed(null);
        setMedName('');
        setMedDosage('');
        setMedIcon('pill');
        setMedColor('blue');
        setView('addMed');
    };

    const openEditMed = (med) => {
        setEditingMed(med);
        setMedName(med.name);
        setMedDosage(med.dosage);
        setMedIcon(med.icon);
        setMedColor(med.color);
        setView('editMed');
    };

    const saveMed = () => {
        if (!medName.trim()) return;

        if (editingMed) {
            const updated = medications.map(m =>
                m.id === editingMed.id
                    ? { ...m, name: medName.trim(), dosage: medDosage.trim(), icon: medIcon, color: medColor }
                    : m
            );
            setMedications(updated);
            saveMedications(updated);
        } else {
            const newMed = {
                id: uuid(),
                name: medName.trim(),
                dosage: medDosage.trim(),
                icon: medIcon,
                color: medColor,
            };
            const updated = [...medications, newMed];
            setMedications(updated);
            saveMedications(updated);
        }
        setView('meds');
    };

    const deleteMed = (id) => {
        const updated = medications.filter(m => m.id !== id);
        setMedications(updated);
        saveMedications(updated);
    };

    const formatTime = (iso) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    const quickLog = (med) => {
        const now = new Date();
        setLogTime(now.toTimeString().slice(0, 5));
        setPendingMed(med);
        setShowTimeModal(true);
    };

    const confirmLog = () => {
        if (!pendingMed) return;
        const [hours, minutes] = logTime.split(':');
        const timestamp = new Date();
        timestamp.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        const newLog = {
            id: uuid(),
            name: pendingMed.name,
            dosage: pendingMed.dosage,
            icon: pendingMed.icon,
            color: pendingMed.color,
            timestamp: timestamp.toISOString()
        };
        const updatedLogs = [newLog, ...logs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setLogs(updatedLogs);
        saveLogs(updatedLogs);
        setShowTimeModal(false);
        setPendingMed(null);
    };

    if (view === 'home') {
        return (
            <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "'DM Sans', -apple-system, sans-serif" }}>
                <div className="px-5 pt-10 pb-4 flex items-center justify-between">
                    <div>
                        <p className="text-zinc-500 text-xs tracking-widest uppercase font-medium">Today</p>
                        <h1 className="text-xl font-light mt-1">{today}</h1>
                    </div>
                    <button
                        onClick={() => setView('meds')}
                        className="w-9 h-9 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                </div>

                <div className="px-5 flex-1" style={{ paddingBottom: medications.length > 0 ? '140px' : '100px' }}>
                    {logs.length === 0 ? (
                        <div className="text-zinc-600 text-center py-12">
                            <p className="text-zinc-500">No medications logged today</p>
                            {medications.length > 0 && (
                                <p className="text-xs mt-1 text-zinc-600">Tap a medication below to log</p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {logs.map((log) => (
                                <div key={log.id} className="flex items-center gap-3 py-3 group">
                                    <MedIcon icon={log.icon} color={log.color} />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-zinc-200 truncate">{log.name}</div>
                                        {log.dosage && <div className="text-zinc-500 text-sm">{log.dosage}</div>}
                                    </div>
                                    <div className="text-zinc-500 text-sm tabular-nums">{formatTime(log.timestamp)}</div>
                                    <button
                                        onClick={() => setDeleteTarget(log)}
                                        className="p-2 text-zinc-700 hover:text-red-500 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {medications.length > 0 ? (
                    <div className="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-900 p-4">
                        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                            {medications.map((med) => (
                                <button
                                    key={med.id}
                                    onClick={() => quickLog(med)}
                                    className="flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 active:scale-95 transition-all"
                                >
                                    <MedIcon icon={med.icon} color={med.color} size={28} />
                                    <div className="text-left">
                                        <div className="text-sm font-medium text-zinc-200 whitespace-nowrap">{med.name}</div>
                                        {med.dosage && <div className="text-xs text-zinc-500">{med.dosage}</div>}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-900 p-4">
                        <button
                            onClick={() => setView('meds')}
                            className="w-full py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
                        >
                            + Add your first medication
                        </button>
                    </div>
                )}

                {showTimeModal && pendingMed && (
                    <Modal onClose={() => setShowTimeModal(false)}>
                        <div className="px-5 py-4 border-b border-zinc-800/50 flex items-center gap-3">
                            <MedIcon icon={pendingMed.icon} color={pendingMed.color} />
                            <div>
                                <div className="font-medium">{pendingMed.name}</div>
                                {pendingMed.dosage && <div className="text-sm text-zinc-500">{pendingMed.dosage}</div>}
                            </div>
                        </div>
                        <div className="p-5">
                            <label className="block text-zinc-500 text-xs uppercase tracking-wider mb-2 font-medium">Time taken</label>
                            <input
                                type="time"
                                value={logTime}
                                onChange={e => setLogTime(e.target.value)}
                                autoFocus
                                className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white text-lg focus:outline-none focus:border-green-700/50"
                                style={{ colorScheme: 'dark' }}
                            />
                        </div>
                        <div className="px-5 pb-5 flex gap-3">
                            <button
                                onClick={() => setShowTimeModal(false)}
                                className="flex-1 py-3 rounded-xl border border-zinc-700/50 text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-all font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmLog}
                                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-700 to-emerald-800 text-white font-medium transition-all"
                            >
                                Log
                            </button>
                        </div>
                    </Modal>
                )}

                {deleteTarget && (
                    <ConfirmDialog
                        title="Delete log?"
                        description={`${deleteTarget.name} at ${formatTime(deleteTarget.timestamp)}`}
                        onConfirm={() => { deleteLog(deleteTarget.id); setDeleteTarget(null); }}
                        onCancel={() => setDeleteTarget(null)}
                    />
                )}
            </div>
        );
    }

    if (view === 'meds') {
        return (
            <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "'DM Sans', -apple-system, sans-serif" }}>
                <div className="px-5 pt-10 pb-4 flex items-center gap-4">
                    <button onClick={() => setView('home')} className="text-zinc-400 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-medium flex-1">Medications</h1>
                    <button
                        onClick={openAddMed}
                        className="w-9 h-9 rounded-full bg-green-700 flex items-center justify-center text-white"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                </div>

                <div className="px-5 pb-8">
                    {medications.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-zinc-900 flex items-center justify-center">
                                <svg className="w-7 h-7 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                            </div>
                            <p className="text-zinc-500">No medications yet</p>
                            <p className="text-xs mt-1 text-zinc-600">Tap + to add your first</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {medications.map((med) => (
                                <div key={med.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800 group">
                                    <MedIcon icon={med.icon} color={med.color} size={40} />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{med.name}</div>
                                        {med.dosage && <div className="text-sm text-zinc-500 truncate">{med.dosage}</div>}
                                    </div>
                                    <button
                                        onClick={() => openEditMed(med)}
                                        className="p-2 text-zinc-600 hover:text-white transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setDeleteMedTarget(med)}
                                        className="p-2 text-zinc-600 hover:text-red-500 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {deleteMedTarget && (
                    <ConfirmDialog
                        title="Delete medication?"
                        description={`${deleteMedTarget.name}${deleteMedTarget.dosage ? ` (${deleteMedTarget.dosage})` : ''}`}
                        onConfirm={() => { deleteMed(deleteMedTarget.id); setDeleteMedTarget(null); }}
                        onCancel={() => setDeleteMedTarget(null)}
                    />
                )}
            </div>
        );
    }

    if (view === 'addMed' || view === 'editMed') {
        return (
            <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "'DM Sans', -apple-system, sans-serif" }}>
                <div className="px-5 pt-10 pb-4 flex items-center gap-4">
                    <button onClick={() => setView('meds')} className="text-zinc-400 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-medium">{editingMed ? 'Edit' : 'Add'} Medication</h1>
                </div>

                <div className="px-5 space-y-6 pb-32">
                    <div className="flex justify-center py-4">
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center"
                            style={{ backgroundColor: (COLORS.find(c => c.name === medColor) || COLORS[8]).hex + '20' }}
                        >
                            <div className="w-9 h-9" style={{ color: (COLORS.find(c => c.name === medColor) || COLORS[8]).hex }}>
                                {ICONS[medIcon] || ICONS.pill}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-zinc-500 text-xs uppercase tracking-wider mb-2 font-medium">Name</label>
                        <input
                            type="text"
                            value={medName}
                            onChange={e => setMedName(e.target.value)}
                            placeholder="e.g. Zoloft"
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-green-700/50"
                        />
                    </div>

                    <div>
                        <label className="block text-zinc-500 text-xs uppercase tracking-wider mb-2 font-medium">Dosage (optional)</label>
                        <input
                            type="text"
                            value={medDosage}
                            onChange={e => setMedDosage(e.target.value)}
                            placeholder="e.g. 25mg"
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-green-700/50"
                        />
                    </div>

                    <div>
                        <label className="block text-zinc-500 text-xs uppercase tracking-wider mb-3 font-medium">Icon</label>
                        <div className="flex flex-wrap gap-2">
                            {ICON_NAMES.map((iconName) => (
                                <button
                                    key={iconName}
                                    onClick={() => setMedIcon(iconName)}
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${medIcon === iconName
                                        ? 'bg-zinc-700 ring-2 ring-green-700'
                                        : 'bg-zinc-900 hover:bg-zinc-800'
                                        }`}
                                >
                                    <div className="w-6 h-6 text-zinc-300">
                                        {ICONS[iconName]}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-zinc-500 text-xs uppercase tracking-wider mb-3 font-medium">Color</label>
                        <div className="flex flex-wrap gap-2">
                            {COLORS.map((color) => (
                                <button
                                    key={color.name}
                                    onClick={() => setMedColor(color.name)}
                                    className={`w-10 h-10 rounded-full transition-all ${medColor === color.name
                                        ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-950 scale-110'
                                        : 'hover:scale-105'
                                        }`}
                                    style={{ backgroundColor: color.hex }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent">
                    <button
                        onClick={saveMed}
                        disabled={!medName.trim()}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-green-700 to-emerald-800 text-white font-medium disabled:opacity-40 transition-all"
                    >
                        {editingMed ? 'Save Changes' : 'Add Medication'}
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
