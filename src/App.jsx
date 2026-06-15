import React, { useState, useEffect } from "react";
import {
  Flame, CheckCircle2, XCircle, Calendar, Dumbbell, Trophy,
  Copy, ChevronRight, X, Check, SkipForward, RefreshCw,
  Target, Home, BarChart2, Settings, Clock, Activity, ArrowRight
} from "lucide-react";

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const DAY_SHORT = ["L", "M", "X", "J", "V", "S", "D"];
const STORAGE_KEY = "fittrack_aesthetic_v3";

const JSON_TEMPLATE = `[
  {
    "id": 1,
    "nombre": "Sentadillas Búlgaras",
    "descripcion": "Apoya un pie atrás en un banco. Baja la cadera controlada hasta romper los 90 grados.",
    "imagen": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=500",
    "dias": ["Lunes", "Jueves"],
    "series": "4x10",
    "descanso": "90s",
    "duracion_min": 15,
    "categoria": "Pierna"
  },
  {
    "id": 2,
    "nombre": "Dominadas",
    "descripcion": "Sujeta la barra y tracciona hasta pasar la barbilla. Activa el core.",
    "imagen": "",
    "dias": ["Martes", "Viernes"],
    "series": "3x8",
    "descanso": "120s",
    "duracion_min": 12,
    "categoria": "Espalda"
  }
]`;

// --- Helpers ---
function getTodayDateStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getDayNameFromDate(dateStr) {
  const d = new Date(dateStr);
  let dayIdx = d.getDay() - 1;
  if (dayIdx === -1) dayIdx = 6; // Domingo
  return DAYS[dayIdx];
}

function getTodayDayName() {
  let idx = new Date().getDay() - 1;
  if (idx === -1) idx = 6;
  return DAYS[idx];
}

// --- Componente de Imagen con Fallback ---
function AestheticImage({ src, alt, isCompleted }) {
  const [hasError, setHasError] = useState(!src);

  if (hasError) {
    return (
      <div style={{
        height: 160, background: "linear-gradient(135deg, #f3e8ff, #e0e7ff)",
        display: "flex", alignItems: "center", justifyContent: "center", position: "relative"
      }}>
        <Dumbbell size={48} color="#8b5cf6" style={{ opacity: 0.5 }} />
        {isCompleted && <div style={{ position: "absolute", inset: 0, background: "rgba(16,185,129,0.2)" }} />}
      </div>
    );
  }

  return (
    <div style={{ height: 160, background: "#f3f4f6", position: "relative", overflow: "hidden" }}>
      <img
        src={src}
        alt={alt}
        onError={() => setHasError(true)}
        style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }}
      />
      {isCompleted && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(2px)" }}>
          <div style={{ background: "white", borderRadius: "50%", padding: 8, display: "flex", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
            <CheckCircle2 size={32} color="#10b981" />
          </div>
        </div>
      )}
    </div>
  );
}

// --- App Principal ---
export default function FitTrackAesthetic() {
  // Estado
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { exercises: [], history: {}, streak: 0, lastCompletedDate: "" };
  });

  const [screen, setScreen] = useState(data.exercises.length > 0 ? "agenda" : "import");
  const [selectedDay, setSelectedDay] = useState(getTodayDayName());
  const todayStr = getTodayDateStr();
  const todayName = getTodayDayName();

  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");
  const [skipModalData, setSkipModalData] = useState(null);

  // Inicializar día en el historial
  useEffect(() => {
    if (!data.history[todayStr]) {
      setData(prev => ({ ...prev, history: { ...prev.history, [todayStr]: { completed: [], skipped: [] } } }));
    }
  }, [todayStr]);

  // Persistencia
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  // Lógica de racha
  useEffect(() => {
    if (data.lastCompletedDate && data.lastCompletedDate !== todayStr) {
      const last = new Date(data.lastCompletedDate);
      const now = new Date(todayStr);
      const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
      
      if (diffDays > 1) {
        setData(prev => ({ ...prev, streak: 0 }));
      }
    }
  }, [todayStr, data.lastCompletedDate]);

  const todayHistory = data.history[todayStr] || { completed: [], skipped: [] };
  const dayExercises = data.exercises.filter(e => e.dias.includes(selectedDay));
  const isViewingToday = selectedDay === todayName;
  const totalMinutes = dayExercises.reduce((acc, curr) => acc + (curr.duracion_min || 0), 0);

  // Acciones
  const handleComplete = (id) => {
    setData(prev => {
      const hist = prev.history[todayStr] || { completed: [], skipped: [] };
      if (hist.completed.includes(id)) return prev;

      const newCompleted = [...hist.completed, id];
      let newStreak = prev.streak;
      let newLastDate = prev.lastCompletedDate;

      // Comprobar si ha terminado todos los de hoy
      const todayTotalIds = prev.exercises.filter(e => e.dias.includes(todayName)).map(e => e.id);
      const allDone = todayTotalIds.every(exId => newCompleted.includes(exId) || hist.skipped.includes(exId));

      if (allDone && prev.lastCompletedDate !== todayStr && todayTotalIds.length > 0) {
        newStreak += 1;
        newLastDate = todayStr;
      }

      return {
        ...prev,
        streak: newStreak,
        lastCompletedDate: newLastDate,
        history: { ...prev.history, [todayStr]: { ...hist, completed: newCompleted } }
      };
    });
  };

  const handleSkipAction = (action, exercise) => {
    setData(prev => {
      const hist = prev.history[todayStr] || { completed: [], skipped: [] };
      const newExercises = [...prev.exercises];

      if (action === "tomorrow") {
        let currentIdx = DAYS.indexOf(todayName);
        let tomorrowName = DAYS[(currentIdx + 1) % 7];
        
        const exIndex = newExercises.findIndex(e => e.id === exercise.id);
        if (exIndex !== -1 && !newExercises[exIndex].dias.includes(tomorrowName)) {
          newExercises[exIndex].dias.push(tomorrowName);
        }
      }

      return {
        ...prev,
        exercises: newExercises,
        history: {
          ...prev.history,
          [todayStr]: { ...hist, skipped: [...hist.skipped, exercise.id] }
        }
      };
    });
    setSkipModalData(null);
  };

  const handleImport = () => {
    setImportError("");
    try {
      const parsed = JSON.parse(importText);
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Debe ser una lista JSON [...]");
      if (!parsed[0].nombre || !parsed[0].dias) throw new Error("Faltan campos obligatorios");

      setData(prev => ({
        ...prev,
        exercises: parsed.map((e, i) => ({
          ...e,
          id: e.id || i + 1,
          categoria: e.categoria || "General",
          duracion_min: e.duracion_min || 10
        }))
      }));
      setImportText("");
      setScreen("agenda");
    } catch (e) {
      setImportError("Error de formato: " + e.message);
    }
  };

  const copyTemplate = () => {
    navigator.clipboard.writeText(JSON_TEMPLATE);
    alert("¡Plantilla copiada!");
  };

  // Estadísticas de Categorías
  const categoryStats = {};
  Object.values(data.history).forEach(dayHist => {
    dayHist.completed.forEach(id => {
      const ex = data.exercises.find(e => e.id === id);
      if (ex) {
        categoryStats[ex.categoria] = (categoryStats[ex.categoria] || 0) + 1;
      }
    });
  });
  const maxCategory = Math.max(...Object.values(categoryStats), 1);

  // --- Vistas ---
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#fcfcfd", fontFamily: "system-ui, sans-serif", paddingBottom: 100, color: "#111827", boxSizing: "border-box", position: "relative" }}>
      
      {/* HEADER AGENDA */}
      {screen === "agenda" && (
        <div style={{ background: "white", padding: "30px 24px 20px", borderRadius: "0 0 32px 32px", boxShadow: "0 4px 30px rgba(0,0,0,0.03)", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <p style={{ margin: "0 0 4px", fontSize: 13, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{todayStr}</p>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#111827", letterSpacing: "-0.5px" }}>Tu Agenda</h1>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff7ed", padding: "8px 16px", borderRadius: 20, border: "1px solid #ffedd5" }}>
              <Flame size={20} color="#f97316" />
              <span style={{ fontSize: 16, fontWeight: 700, color: "#ea580c" }}>{data.streak}</span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            {DAYS.map((day, i) => {
              const isActive = selectedDay === day;
              const isToday = day === todayName;
              return (
                <div key={day} onClick={() => setSelectedDay(day)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0", borderRadius: 16, background: isActive ? "#111827" : "transparent", cursor: "pointer", transition: "all 0.3s ease" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: isActive ? "#9ca3af" : "#6b7280", marginBottom: 6 }}>{DAY_SHORT[i]}</span>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: isActive ? "white" : isToday ? "#111827" : "transparent" }} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CONTENIDO AGENDA */}
      {screen === "agenda" && (
        <div style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{isViewingToday ? "Para Hoy" : selectedDay}</h2>
            {totalMinutes > 0 && (
              <span style={{ fontSize: 13, fontWeight: 600, color: "#4f46e5", background: "#e0e7ff", padding: "6px 12px", borderRadius: 20, display: "flex", alignItems: "center", gap: 6 }}>
                <Clock size={14} /> {totalMinutes} min
              </span>
            )}
          </div>

          {dayExercises.length === 0 ? (
             <div style={{ background: "white", borderRadius: 24, padding: "40px 20px", textAlign: "center", boxShadow: "0 10px 40px rgba(0,0,0,0.03)" }}>
               <div style={{ width: 64, height: 64, background: "#f3f4f6", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <Calendar size={28} color="#9ca3af" />
               </div>
               <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700 }}>Día Libre</h3>
               <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>Disfruta tu descanso. Tus músculos crecen hoy.</p>
             </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {dayExercises.map(ex => {
                const isCompleted = isViewingToday && todayHistory.completed.includes(ex.id);
                const isSkipped = isViewingToday && todayHistory.skipped.includes(ex.id);
                
                return (
                  <div key={ex.id} style={{ background: "white", borderRadius: 24, overflow: "hidden", boxShadow: "0 10px 40px rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.02)", opacity: (isCompleted || isSkipped) ? 0.6 : 1, transition: "all 0.3s" }}>
                    <AestheticImage src={ex.imagen} alt={ex.nombre} isCompleted={isCompleted} />
                    
                    <div style={{ padding: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", textTransform: "uppercase", letterSpacing: 1 }}>{ex.categoria}</span>
                          <h3 style={{ margin: "4px 0 0", fontSize: 18, fontWeight: 800 }}>{ex.nombre}</h3>
                        </div>
                        {isSkipped && <span style={{ fontSize: 12, background: "#f3f4f6", padding: "4px 10px", borderRadius: 12, fontWeight: 600 }}>Saltado</span>}
                      </div>

                      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, background: "#f3f4f6", padding: "6px 12px", borderRadius: 12, color: "#4b5563" }}>💪 {ex.series}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, background: "#f3f4f6", padding: "6px 12px", borderRadius: 12, color: "#4b5563" }}>⏳ {ex.descanso}</span>
                      </div>

                      <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, margin: "0 0 20px" }}>{ex.descripcion}</p>

                      {isViewingToday && !isCompleted && !isSkipped && (
                        <div style={{ display: "flex", gap: 12 }}>
                          <button onClick={() => handleComplete(ex.id)} style={{ flex: 1, padding: "14px", borderRadius: 16, border: "none", background: "#111827", color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                            <Check size={18} /> Hecho
                          </button>
                          <button onClick={() => setSkipModalData(ex)} style={{ width: 52, borderRadius: 16, border: "1px solid #e5e7eb", background: "white", color: "#6b7280", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <X size={20} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PANTALLA DE ESTADÍSTICAS */}
      {screen === "stats" && (
        <div style={{ padding: "30px 24px" }}>
          <h1 style={{ margin: "0 0 30px", fontSize: 28, fontWeight: 800, color: "#111827" }}>Tu Progreso</h1>

          {/* Racha Card */}
          <div style={{ background: "linear-gradient(135deg, #f97316, #ea580c)", borderRadius: 32, padding: "32px 24px", color: "white", textAlign: "center", marginBottom: 32, boxShadow: "0 20px 40px rgba(234,88,12,0.2)" }}>
            <Flame size={48} color="white" style={{ margin: "0 auto 16px", opacity: 0.9 }} />
            <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1, letterSpacing: "-2px" }}>{data.streak}</div>
            <div style={{ fontSize: 14, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, opacity: 0.9, marginTop: 8 }}>Días de Fuego</div>
          </div>

          <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700 }}>Músculos Entrenados (Histórico)</h3>
          
          <div style={{ background: "white", borderRadius: 24, padding: 24, boxShadow: "0 10px 40px rgba(0,0,0,0.03)" }}>
            {Object.keys(categoryStats).length === 0 ? (
               <p style={{ margin: 0, fontSize: 14, color: "#6b7280", textAlign: "center" }}>Aún no has completado ejercicios. ¡Empieza hoy!</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {Object.entries(categoryStats).sort((a,b) => b[1] - a[1]).map(([cat, count]) => {
                  const percent = (count / maxCategory) * 100;
                  return (
                    <div key={cat}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>{cat}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{count} reps</span>
                      </div>
                      <div style={{ height: 10, background: "#f3f4f6", borderRadius: 10, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${percent}%`, background: "#4f46e5", borderRadius: 10, transition: "width 1s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PANTALLA IMPORTAR / AJUSTES */}
      {screen === "import" && (
        <div style={{ padding: "30px 24px" }}>
          <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 800, color: "#111827" }}>Configuración</h1>
          <p style={{ fontSize: 15, color: "#6b7280", margin: "0 0 30px" }}>Añade o cambia tu rutina pegando el código JSON.</p>

          <div style={{ background: "white", borderRadius: 24, padding: 24, boxShadow: "0 10px 40px rgba(0,0,0,0.03)", marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Importar Rutina</h3>
              <button onClick={copyTemplate} style={{ border: "none", background: "transparent", color: "#4f46e5", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                <Copy size={14} /> Formato
              </button>
            </div>
            
            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder="[{ ... }]"
              style={{ width: "100%", height: 200, padding: 16, borderRadius: 16, border: "1px solid #e5e7eb", fontSize: 13, fontFamily: "monospace", boxSizing: "border-box", background: "#f9fafb", outline: "none", resize: "none" }}
            />
            {importError && <p style={{ fontSize: 13, color: "#ef4444", marginTop: 12, fontWeight: 500 }}>{importError}</p>}
            
            <button onClick={handleImport} style={{ width: "100%", padding: "16px 0", borderRadius: 16, border: "none", background: "#111827", color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 16 }}>
              Cargar Ejercicios
            </button>
          </div>

          {data.exercises.length > 0 && (
            <button onClick={() => {
              if(window.confirm("¿Seguro que quieres borrar tu progreso?")) {
                localStorage.removeItem(STORAGE_KEY);
                window.location.reload();
              }
            }} style={{ width: "100%", padding: "16px 0", borderRadius: 16, border: "1px solid #fee2e2", background: "#fef2f2", color: "#ef4444", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
              Borrar todos los datos
            </button>
          )}
        </div>
      )}

      {/* MODAL SKIP */}
      {skipModalData && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(17,24,39,0.4)", display: "flex", alignItems: "flex-end", zIndex: 1000, padding: 16, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "white", width: "100%", borderRadius: 32, padding: "32px 24px", boxSizing: "border-box", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800 }}>¿Qué hacemos con esto?</h3>
            <p style={{ margin: "0 0 24px", fontSize: 15, color: "#6b7280" }}>{skipModalData.nombre}</p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button onClick={() => handleSkipAction("tomorrow", skipModalData)} style={{ width: "100%", padding: "16px", borderRadius: 16, border: "none", background: "#e0e7ff", color: "#4338ca", fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <ArrowRight size={20} /> Pasarlo a Mañana
              </button>
              <button onClick={() => handleSkipAction("skip", skipModalData)} style={{ width: "100%", padding: "16px", borderRadius: 16, border: "1px solid #e5e7eb", background: "white", color: "#4b5563", fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <SkipForward size={20} /> Omitir por hoy
              </button>
            </div>
            <button onClick={() => setSkipModalData(null)} style={{ width: "100%", padding: "16px", background: "transparent", border: "none", color: "#9ca3af", fontSize: 15, fontWeight: 600, marginTop: 8, cursor: "pointer" }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* BOTTOM NAVIGATION */}
      {data.exercises.length > 0 && (
        <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", width: "calc(100% - 40px)", maxWidth: 440, background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)", borderRadius: 30, display: "flex", padding: "12px", boxSizing: "border-box", zIndex: 50, boxShadow: "0 10px 40px rgba(0,0,0,0.08)", border: "1px solid rgba(0,0,0,0.05)" }}>
          <div onClick={() => setScreen("agenda")} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", color: screen === "agenda" ? "#111827" : "#9ca3af", transition: "color 0.3s" }}>
            <div style={{ padding: "8px 24px", background: screen === "agenda" ? "#f3f4f6" : "transparent", borderRadius: 20 }}>
              <Home size={24} strokeWidth={screen === "agenda" ? 2.5 : 2} />
            </div>
          </div>
          <div onClick={() => setScreen("stats")} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", color: screen === "stats" ? "#111827" : "#9ca3af", transition: "color 0.3s" }}>
             <div style={{ padding: "8px 24px", background: screen === "stats" ? "#f3f4f6" : "transparent", borderRadius: 20 }}>
              <BarChart2 size={24} strokeWidth={screen === "stats" ? 2.5 : 2} />
            </div>
          </div>
          <div onClick={() => setScreen("import")} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", color: screen === "import" ? "#111827" : "#9ca3af", transition: "color 0.3s" }}>
            <div style={{ padding: "8px 24px", background: screen === "import" ? "#f3f4f6" : "transparent", borderRadius: 20 }}>
              <Settings size={24} strokeWidth={screen === "import" ? 2.5 : 2} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}