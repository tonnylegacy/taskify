import { useState, useEffect, useReducer, useRef } from "react";

// ─── Simulated Backend (in-memory + localStorage) ───────────────────────────

const DB_KEY = "taskify_tasks";

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(tasks) {
  localStorage.setItem(DB_KEY, JSON.stringify(tasks));
}

// Simulated async API
const api = {
  getAll: () => Promise.resolve([...loadFromStorage()]),
  create: (data) => {
    const tasks = loadFromStorage();
    const newTask = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newTask, ...tasks];
    saveToStorage(updated);
    return Promise.resolve(newTask);
  },
  update: (id, data) => {
    const tasks = loadFromStorage();
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t
    );
    saveToStorage(updated);
    return Promise.resolve(updated.find((t) => t.id === id));
  },
  delete: (id) => {
    const tasks = loadFromStorage();
    saveToStorage(tasks.filter((t) => t.id !== id));
    return Promise.resolve({ success: true });
  },
};

// ─── Validation ──────────────────────────────────────────────────────────────

function validate(fields) {
  const errors = {};
  if (!fields.title || fields.title.trim().length < 2)
    errors.title = "Title must be at least 2 characters.";
  if (!fields.category) errors.category = "Please select a category.";
  if (!fields.priority) errors.priority = "Please select a priority.";
  if (!fields.dueDate) errors.dueDate = "Due date is required.";
  return errors;
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

const initialState = {
  tasks: [],
  loading: false,
  filter: "all",
  sortBy: "createdAt",
  search: "",
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_LOADING": return { ...state, loading: action.payload };
    case "SET_TASKS": return { ...state, tasks: action.payload, loading: false };
    case "ADD_TASK": return { ...state, tasks: [action.payload, ...state.tasks] };
    case "UPDATE_TASK":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
      };
    case "DELETE_TASK":
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.payload) };
    case "SET_FILTER": return { ...state, filter: action.payload };
    case "SET_SORT": return { ...state, sortBy: action.payload };
    case "SET_SEARCH": return { ...state, search: action.payload };
    default: return state;
  }
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PRIORITIES = ["Low", "Medium", "High"];
const CATEGORIES = ["Work", "Personal", "Health", "Finance", "Learning", "Other"];
const PRIORITY_COLOR = { Low: "#4ade80", Medium: "#facc15", High: "#f87171" };
const PRIORITY_BG = { Low: "#052e16", Medium: "#1c1917", High: "#1c0a0a" };

const EMPTY_FORM = { title: "", description: "", category: "", priority: "", dueDate: "" };

// ─── Components ──────────────────────────────────────────────────────────────

function Badge({ label, color, bg }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, letterSpacing: "0.05em",
      textTransform: "uppercase", padding: "2px 8px", borderRadius: 4,
      color, background: bg, border: `1px solid ${color}33`,
    }}>
      {label}
    </span>
  );
}

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = { success: "#4ade80", error: "#f87171", info: "#60a5fa" };
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24, zIndex: 9999,
      background: "#18181b", border: `1px solid ${colors[type] || "#60a5fa"}`,
      color: "#f4f4f5", borderRadius: 10, padding: "12px 20px",
      fontSize: 14, fontFamily: "'Inter', sans-serif",
      boxShadow: "0 8px 32px #0008", display: "flex", alignItems: "center", gap: 10,
      animation: "slideUp 0.2s ease",
    }}>
      <span style={{ color: colors[type] }}>
        {type === "success" ? "✓" : type === "error" ? "✕" : "ℹ"}
      </span>
      {message}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "#000a", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "fadeIn 0.15s ease",
    }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: "#18181b", border: "1px solid #3f3f46", borderRadius: 16,
        padding: "28px 32px", width: "100%", maxWidth: 480,
        boxShadow: "0 24px 64px #0009", animation: "scaleIn 0.15s ease",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ color: "#f4f4f5", fontSize: 18, fontWeight: 700, fontFamily: "'Inter', sans-serif", margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: "#71717a", cursor: "pointer",
            fontSize: 20, lineHeight: 1, padding: 4,
          }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function TaskForm({ initial, onSubmit, onCancel, submitting }) {
  const [fields, setFields] = useState(initial || EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const firstRef = useRef();

  useEffect(() => { firstRef.current?.focus(); }, []);

  const set = (k, v) => {
    setFields((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => { const n = { ...e }; delete n[k]; return n; });
  };

  const handleSubmit = () => {
    const errs = validate(fields);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit(fields);
  };

  const inputStyle = (hasErr) => ({
    width: "100%", background: "#09090b", border: `1px solid ${hasErr ? "#f87171" : "#3f3f46"}`,
    borderRadius: 8, color: "#f4f4f5", fontSize: 14, padding: "10px 12px",
    fontFamily: "'Inter', sans-serif", outline: "none", boxSizing: "border-box",
    transition: "border-color 0.15s",
  });

  const errMsg = (k) => errors[k] && (
    <p style={{ color: "#f87171", fontSize: 12, margin: "4px 0 0", fontFamily: "'Inter', sans-serif" }}>{errors[k]}</p>
  );

  const label = (text, required) => (
    <label style={{ color: "#a1a1aa", fontSize: 13, fontWeight: 600, fontFamily: "'Inter', sans-serif", display: "block", marginBottom: 6 }}>
      {text} {required && <span style={{ color: "#f87171" }}>*</span>}
    </label>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        {label("Task title", true)}
        <input ref={firstRef} value={fields.title} onChange={(e) => set("title", e.target.value)}
          placeholder="e.g. Review project proposal" style={inputStyle(errors.title)} />
        {errMsg("title")}
      </div>

      <div>
        {label("Description")}
        <textarea value={fields.description} onChange={(e) => set("description", e.target.value)}
          placeholder="Optional details..." rows={3}
          style={{ ...inputStyle(false), resize: "vertical", lineHeight: 1.5 }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          {label("Category", true)}
          <select value={fields.category} onChange={(e) => set("category", e.target.value)}
            style={{ ...inputStyle(errors.category), cursor: "pointer" }}>
            <option value="">Select...</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          {errMsg("category")}
        </div>
        <div>
          {label("Priority", true)}
          <select value={fields.priority} onChange={(e) => set("priority", e.target.value)}
            style={{ ...inputStyle(errors.priority), cursor: "pointer" }}>
            <option value="">Select...</option>
            {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
          </select>
          {errMsg("priority")}
        </div>
      </div>

      <div>
        {label("Due date", true)}
        <input type="date" value={fields.dueDate} onChange={(e) => set("dueDate", e.target.value)}
          style={{ ...inputStyle(errors.dueDate), colorScheme: "dark" }} />
        {errMsg("dueDate")}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button onClick={handleSubmit} disabled={submitting}
          style={{
            flex: 1, background: submitting ? "#3f3f46" : "#6366f1", color: "#fff",
            border: "none", borderRadius: 8, padding: "11px 0", fontSize: 14,
            fontWeight: 700, fontFamily: "'Inter', sans-serif", cursor: submitting ? "not-allowed" : "pointer",
            transition: "background 0.15s",
          }}>
          {submitting ? "Saving..." : initial?.title ? "Save changes" : "Add task"}
        </button>
        <button onClick={onCancel}
          style={{
            background: "#27272a", color: "#a1a1aa", border: "1px solid #3f3f46",
            borderRadius: 8, padding: "11px 20px", fontSize: 14,
            fontFamily: "'Inter', sans-serif", cursor: "pointer",
          }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function TaskCard({ task, onEdit, onDelete, onToggle }) {
  const isOverdue = !task.completed && task.dueDate && new Date(task.dueDate) < new Date();
  const dueLabel = task.dueDate ? new Date(task.dueDate + "T00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null;

  return (
    <div style={{
      background: "#18181b", border: `1px solid ${task.completed ? "#27272a" : "#3f3f46"}`,
      borderRadius: 12, padding: "16px 18px", transition: "border-color 0.15s, transform 0.1s",
      opacity: task.completed ? 0.6 : 1,
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <button onClick={() => onToggle(task)} style={{
          width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
          border: `2px solid ${task.completed ? "#6366f1" : "#52525b"}`,
          background: task.completed ? "#6366f1" : "transparent",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 11, fontWeight: 900, transition: "all 0.15s",
        }}>
          {task.completed ? "✓" : ""}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: 0, fontSize: 15, fontWeight: 600, fontFamily: "'Inter', sans-serif",
            color: task.completed ? "#52525b" : "#f4f4f5",
            textDecoration: task.completed ? "line-through" : "none",
            wordBreak: "break-word",
          }}>{task.title}</p>
          {task.description && (
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#71717a", fontFamily: "'Inter', sans-serif", lineHeight: 1.5 }}>
              {task.description}
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button onClick={() => onEdit(task)} title="Edit" style={{
            background: "#27272a", border: "none", color: "#a1a1aa", borderRadius: 6,
            width: 30, height: 30, cursor: "pointer", fontSize: 13,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>✎</button>
          <button onClick={() => onDelete(task.id)} title="Delete" style={{
            background: "#27272a", border: "none", color: "#f87171", borderRadius: 6,
            width: 30, height: 30, cursor: "pointer", fontSize: 13,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <Badge label={task.priority} color={PRIORITY_COLOR[task.priority]} bg={PRIORITY_BG[task.priority]} />
        <Badge label={task.category} color="#60a5fa" bg="#172033" />
        {dueLabel && (
          <span style={{
            fontSize: 12, color: isOverdue ? "#f87171" : "#71717a",
            fontFamily: "'Inter', sans-serif", marginLeft: "auto",
          }}>
            {isOverdue ? "⚠ " : ""}Due {dueLabel}
          </span>
        )}
      </div>
    </div>
  );
}

function StatsBar({ tasks }) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.completed).length;
  const overdue = tasks.filter((t) => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
      {[
        { label: "Total tasks", value: total, color: "#60a5fa" },
        { label: "Completed", value: `${done} (${pct}%)`, color: "#4ade80" },
        { label: "Overdue", value: overdue, color: overdue ? "#f87171" : "#52525b" },
      ].map((s) => (
        <div key={s.label} style={{
          background: "#18181b", border: "1px solid #27272a", borderRadius: 10,
          padding: "12px 16px", textAlign: "center",
        }}>
          <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "'Inter', sans-serif" }}>{s.value}</p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#52525b", fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function Taskify() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [modal, setModal] = useState(null); // null | "add" | task (for edit)
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const notify = (message, type = "success") => setToast({ message, type });

  useEffect(() => {
    dispatch({ type: "SET_LOADING", payload: true });
    api.getAll().then((tasks) => dispatch({ type: "SET_TASKS", payload: tasks }));
  }, []);

  const handleAdd = async (fields) => {
    setSubmitting(true);
    try {
      const task = await api.create({ ...fields, completed: false });
      dispatch({ type: "ADD_TASK", payload: task });
      setModal(null);
      notify("Task added successfully.");
    } catch {
      notify("Failed to add task.", "error");
    } finally { setSubmitting(false); }
  };

  const handleEdit = async (fields) => {
    setSubmitting(true);
    try {
      const updated = await api.update(modal.id, fields);
      dispatch({ type: "UPDATE_TASK", payload: updated });
      setModal(null);
      notify("Task updated.");
    } catch {
      notify("Failed to update task.", "error");
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    setConfirmDelete(null);
    await api.delete(id);
    dispatch({ type: "DELETE_TASK", payload: id });
    notify("Task deleted.", "info");
  };

  const handleToggle = async (task) => {
    const updated = await api.update(task.id, { completed: !task.completed });
    dispatch({ type: "UPDATE_TASK", payload: updated });
  };

  // Filtering + sorting
  const filtered = state.tasks
    .filter((t) => {
      if (state.filter === "active") return !t.completed;
      if (state.filter === "completed") return t.completed;
      if (state.filter === "overdue") return !t.completed && t.dueDate && new Date(t.dueDate) < new Date();
      return true;
    })
    .filter((t) => {
      const q = state.search.toLowerCase();
      return !q || t.title.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (state.sortBy === "dueDate") return (a.dueDate || "z").localeCompare(b.dueDate || "z");
      if (state.sortBy === "priority") return PRIORITIES.indexOf(b.priority) - PRIORITIES.indexOf(a.priority);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const filterBtns = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "completed", label: "Done" },
    { key: "overdue", label: "Overdue" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; }
        input:focus, select:focus, textarea:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 3px #6366f133; }
        button:focus-visible { outline: 2px solid #6366f1; outline-offset: 2px; }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes scaleIn { from { transform: scale(0.96); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(12px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        ::-webkit-scrollbar { width: 6px } ::-webkit-scrollbar-track { background: #09090b }
        ::-webkit-scrollbar-thumb { background: #27272a; border-radius: 3px }
      `}</style>

      {/* Header */}
      <header style={{
        borderBottom: "1px solid #27272a", padding: "0 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 60, position: "sticky", top: 0, background: "#09090b", zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>✔</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: "#f4f4f5", letterSpacing: "-0.02em" }}>
            Taskify
          </span>
        </div>
        <button onClick={() => setModal("add")}
          style={{
            background: "#6366f1", color: "#fff", border: "none", borderRadius: 8,
            padding: "8px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6, transition: "background 0.15s",
          }}
          onMouseOver={(e) => e.currentTarget.style.background = "#4f46e5"}
          onMouseOut={(e) => e.currentTarget.style.background = "#6366f1"}
        >
          + New task
        </button>
      </header>

      {/* Body */}
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "28px 16px" }}>
        <StatsBar tasks={state.tasks} />

        {/* Search + Sort */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <input
            value={state.search}
            onChange={(e) => dispatch({ type: "SET_SEARCH", payload: e.target.value })}
            placeholder="Search tasks..."
            style={{
              flex: 1, background: "#18181b", border: "1px solid #3f3f46",
              borderRadius: 8, color: "#f4f4f5", fontSize: 14, padding: "9px 12px",
              fontFamily: "'Inter', sans-serif", outline: "none",
            }}
          />
          <select
            value={state.sortBy}
            onChange={(e) => dispatch({ type: "SET_SORT", payload: e.target.value })}
            style={{
              background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8,
              color: "#a1a1aa", fontSize: 13, padding: "9px 10px",
              fontFamily: "'Inter', sans-serif", outline: "none", cursor: "pointer",
            }}
          >
            <option value="createdAt">Newest</option>
            <option value="dueDate">Due date</option>
            <option value="priority">Priority</option>
          </select>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
          {filterBtns.map((f) => (
            <button key={f.key}
              onClick={() => dispatch({ type: "SET_FILTER", payload: f.key })}
              style={{
                background: state.filter === f.key ? "#6366f1" : "#18181b",
                color: state.filter === f.key ? "#fff" : "#71717a",
                border: `1px solid ${state.filter === f.key ? "#6366f1" : "#3f3f46"}`,
                borderRadius: 7, padding: "6px 14px", fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "'Inter', sans-serif", transition: "all 0.15s",
              }}
            >{f.label}</button>
          ))}
        </div>

        {/* Task list */}
        {state.loading ? (
          <p style={{ textAlign: "center", color: "#52525b", paddingTop: 40, fontFamily: "'Inter', sans-serif" }}>Loading tasks...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <p style={{ fontSize: 36, margin: "0 0 12px" }}>📋</p>
            <p style={{ color: "#52525b", fontSize: 15, fontFamily: "'Inter', sans-serif" }}>
              {state.search ? "No tasks match your search." : "No tasks here. Add one to get started."}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((task) => (
              <TaskCard key={task.id} task={task}
                onEdit={(t) => setModal(t)}
                onDelete={(id) => setConfirmDelete(id)}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}
      </main>

      {/* Add modal */}
      {modal === "add" && (
        <Modal title="New task" onClose={() => setModal(null)}>
          <TaskForm onSubmit={handleAdd} onCancel={() => setModal(null)} submitting={submitting} />
        </Modal>
      )}

      {/* Edit modal */}
      {modal && modal !== "add" && (
        <Modal title="Edit task" onClose={() => setModal(null)}>
          <TaskForm initial={modal} onSubmit={handleEdit} onCancel={() => setModal(null)} submitting={submitting} />
        </Modal>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <Modal title="Delete task?" onClose={() => setConfirmDelete(null)}>
          <p style={{ color: "#a1a1aa", fontSize: 14, marginBottom: 20, fontFamily: "'Inter', sans-serif" }}>
            This action cannot be undone.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => handleDelete(confirmDelete)}
              style={{
                flex: 1, background: "#dc2626", color: "#fff", border: "none",
                borderRadius: 8, padding: 11, fontSize: 14, fontWeight: 700,
                cursor: "pointer", fontFamily: "'Inter', sans-serif",
              }}>Delete</button>
            <button onClick={() => setConfirmDelete(null)}
              style={{
                background: "#27272a", color: "#a1a1aa", border: "1px solid #3f3f46",
                borderRadius: 8, padding: "11px 20px", fontSize: 14,
                cursor: "pointer", fontFamily: "'Inter', sans-serif",
              }}>Cancel</button>
          </div>
        </Modal>
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
