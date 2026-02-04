"use client";

import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Plus,
  Search,
  CheckCircle2,
  Circle,
  Trash2,
  Pencil,
  Calendar,
  Flag,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { clearAuthToken, getAuthToken } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/api";

type Priority = "low" | "medium" | "high";

type Task = {
  id: string; // Mongo _id
  title: string;
  description?: string;
  createdAt: string; // ISO
  dueDate?: string; // ISO
  priority: Priority;
  completed: boolean;
};

const TASKS_STORAGE_KEY = "focusflow_tasks";

const priorityLabel: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const priorityClasses: Record<Priority, string> = {
  low: "bg-emerald-500/10 text-emerald-200 border-emerald-500/20",
  medium: "bg-amber-500/10 text-amber-200 border-amber-500/20",
  high: "bg-rose-500/10 text-rose-200 border-rose-500/20",
};

function generateId() {
  return Math.random().toString(36).slice(2);
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}

function loadTasksFromStorage(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Task[];
  } catch {
    return [];
  }
}

function saveTasksToStorage(tasks: Task[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-lg"
    >
      <div className="flex items-center justify-between">
        <p className="text-white/70 text-sm">{title}</p>
        <div className="text-white/60">{icon}</div>
      </div>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </motion.div>
  );
}

function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/70" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="relative z-10 w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950/70 backdrop-blur-2xl shadow-2xl"
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ✅ Skeleton for loading state */
function Skeleton({ className }: { className: string }) {
  return (
    <div className={cn("animate-pulse rounded-xl bg-white/10", className)} />
  );
}

function CursorGlow() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDesktop, setIsDesktop] = useState(false);

  const [hoveringInteractive, setHoveringInteractive] = useState(false);
  const [accent, setAccent] = useState<"default" | "low" | "medium" | "high">(
    "default"
  );

  const [ripples, setRipples] = useState<
    { id: string; x: number; y: number; accent: typeof accent }[]
  >([]);

  useEffect(() => {
    const check = () => setIsDesktop(window.matchMedia("(pointer:fine)").matches);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!isDesktop) return;
    const move = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, [isDesktop]);

  useEffect(() => {
    if (!isDesktop) return;

    const isInteractive = (el: Element | null) => {
      if (!el) return false;
      return !!el.closest(
        "button, a, input, textarea, select, [role='button'], [data-interactive='true']"
      );
    };

    const onMove = (e: MouseEvent) => {
      const target = e.target as Element | null;
      setHoveringInteractive(isInteractive(target));

      const chip = target?.closest("[data-priority]") as HTMLElement | null;
      const p = (chip?.dataset?.priority ?? "default") as any;

      if (p === "low" || p === "medium" || p === "high") setAccent(p);
      else setAccent("default");
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [isDesktop]);

  useEffect(() => {
    if (!isDesktop) return;

    const onClick = (e: MouseEvent) => {
      const id = Math.random().toString(36).slice(2);
      const ripple = { id, x: e.clientX, y: e.clientY, accent };
      setRipples((prev) => [...prev, ripple]);

      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);
    };

    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [isDesktop, accent]);

  if (!isDesktop) return null;

  const accentRGBA = {
    default: "56,189,248",
    low: "34,197,94",
    medium: "245,158,11",
    high: "244,63,94",
  }[accent];

  const sizeOuter = hoveringInteractive ? 70 : 40;
  const sizeInner = hoveringInteractive ? 8 : 10;

  return (
    <>
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.div
            key={r.id}
            className="pointer-events-none fixed left-0 top-0 z-[9998] -translate-x-1/2 -translate-y-1/2 rounded-full border"
            style={{
              x: r.x,
              y: r.y,
              width: 16,
              height: 16,
              borderColor: `rgba(${accentRGBA}, 0.35)`,
              boxShadow: `0 0 30px rgba(${accentRGBA}, 0.12)`,
            }}
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{ opacity: 1, scale: 5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>

      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[9999] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: sizeOuter,
          height: sizeOuter,
          background: `radial-gradient(circle, rgba(${accentRGBA},0.28) 0%, rgba(${accentRGBA},0.08) 45%, rgba(${accentRGBA},0) 70%)`,
          filter: "blur(1px)",
        }}
        animate={{ x: pos.x, y: pos.y }}
        transition={{ type: "spring", stiffness: 180, damping: 22, mass: 0.2 }}
      />

      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[9999] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: sizeInner,
          height: sizeInner,
          background: `rgba(${accentRGBA},0.95)`,
          boxShadow: `0 0 26px rgba(${accentRGBA},0.55)`,
        }}
        animate={{ x: pos.x, y: pos.y }}
        transition={{ type: "spring", stiffness: 450, damping: 30, mass: 0.12 }}
      />
    </>
  );
}

/* ✅ Toast system */
type ToastType = "success" | "info" | "danger";

type Toast = {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
};

function toastStyles(type: ToastType) {
  switch (type) {
    case "success":
      return "border-emerald-500/25 bg-emerald-500/10 text-emerald-100";
    case "danger":
      return "border-rose-500/25 bg-rose-500/10 text-rose-100";
    default:
      return "border-sky-500/25 bg-sky-500/10 text-sky-100";
  }
}

export default function FocusFlowDashboard() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [sortBy, setSortBy] = useState<"date" | "priority">("date");

  const [tasks, setTasks] = useState<Task[]>(() => {
    const stored = loadTasksFromStorage();
    if (stored.length > 0) return stored;

    // fallback demo tasks (only before backend fetch)
    return [
      {
        id: generateId(),
        title: "Finish internship dashboard UI",
        description: "Polish UI/UX and add smooth animations",
        createdAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        priority: "high",
        completed: false,
      },
      {
        id: generateId(),
        title: "Design FocusFlow color palette",
        description: "Navy + sky glow theme",
        createdAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
        priority: "medium",
        completed: true,
      },
    ];
  });

  // keep local storage as quick UI cache
  useEffect(() => {
    saveTasksToStorage(tasks);
  }, [tasks]);

  useEffect(() => {
    const t = setTimeout(() => setPageLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  const pushToast = (t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...t, id }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 2400);
  };

  // ✅ Fetch tasks from backend
  useEffect(() => {
    const token = getAuthToken();

    // if no token → go signin
    if (!token) {
      window.location.href = "/signin";
      return;
    }

    const fetchTasks = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/tasks`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          clearAuthToken();
          window.location.href = "/signin";
          return;
        }

        if (Array.isArray(data.tasks)) {
          const mapped: Task[] = data.tasks.map((t: any) => ({
            id: t._id,
            title: t.title,
            description: t.description,
            createdAt: t.createdAt,
            dueDate: t.dueDate,
            priority: t.priority,
            completed: t.completed,
          }));

          setTasks(mapped);
        }
      } catch {
        // if backend down, keep localStorage tasks
      }
    };

    fetchTasks();
  }, []);

  // Modal state
  const [open, setOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState<string>("");

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const active = total - completed;
    const high = tasks.filter((t) => t.priority === "high" && !t.completed).length;
    return { total, completed, active, high };
  }, [tasks]);

  const processed = useMemo(() => {
    let list = [...tasks];

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description?.toLowerCase().includes(q) ?? false)
      );
    }

    if (filter === "active") list = list.filter((t) => !t.completed);
    if (filter === "completed") list = list.filter((t) => t.completed);

    if (sortBy === "date") {
      list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else {
      const score = (p: Priority) => (p === "high" ? 3 : p === "medium" ? 2 : 1);
      list.sort((a, b) => score(b.priority) - score(a.priority));
    }

    return list;
  }, [tasks, query, filter, sortBy]);

  const openAdd = () => {
    setEditTask(null);
    setTitle("");
    setDesc("");
    setPriority("medium");
    setDueDate("");
    setOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditTask(task);
    setTitle(task.title);
    setDesc(task.description ?? "");
    setPriority(task.priority);
    setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "");
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditTask(null);
  };

  const saveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const token = getAuthToken();
    if (!token) {
      clearAuthToken();
      window.location.href = "/signin";
      return;
    }

    try {
      if (editTask) {
        // ✅ optimistic UI update
        setTasks((prev) =>
          prev.map((t) =>
            t.id === editTask.id
              ? {
                  ...t,
                  title: title.trim(),
                  description: desc.trim() ? desc.trim() : undefined,
                  priority,
                  dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
                }
              : t
          )
        );

        await fetch(`${API_BASE_URL}/api/tasks/${editTask.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: title.trim(),
            description: desc.trim() ? desc.trim() : undefined,
            dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
            priority,
          }),
        });

        pushToast({
          type: "success",
          title: "Task updated",
          message: "Changes saved successfully.",
        });
      } else {
        const res = await fetch(`${API_BASE_URL}/api/tasks`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: title.trim(),
            description: desc.trim() ? desc.trim() : undefined,
            dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
            priority,
          }),
        });

        const data = await res.json();

        if (res.ok && data.task) {
          const newTask: Task = {
            id: data.task._id,
            title: data.task.title,
            description: data.task.description,
            createdAt: data.task.createdAt,
            dueDate: data.task.dueDate,
            priority: data.task.priority,
            completed: data.task.completed,
          };

          setTasks((prev) => [newTask, ...prev]);

          pushToast({
            type: "success",
            title: "Task added",
            message: "New task created successfully.",
          });
        } else {
          pushToast({
            type: "danger",
            title: "Failed",
            message: data?.message || "Could not create task",
          });
        }
      }
    } catch {
      pushToast({
        type: "danger",
        title: "Network error",
        message: "Backend not reachable",
      });
    } finally {
      closeModal();
    }
  };

  const toggleComplete = async (id: string) => {
    const token = getAuthToken();
    if (!token) {
      clearAuthToken();
      window.location.href = "/signin";
      return;
    }

    const current = tasks.find((t) => t.id === id);
    if (!current) return;

    const nextCompleted = !current.completed;

    // ✅ optimistic UI
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: nextCompleted } : t))
    );

    pushToast({
      type: "info",
      title: nextCompleted ? "Task completed ✅" : "Task marked active",
      message: current.title,
    });

    try {
      await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ completed: nextCompleted }),
      });
    } catch {
      // rollback on failure
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: current.completed } : t))
      );
    }
  };

  const deleteTask = async (id: string) => {
    const token = getAuthToken();
    if (!token) {
      clearAuthToken();
      window.location.href = "/signin";
      return;
    }

    const task = tasks.find((t) => t.id === id);

    // optimistic UI
    setTasks((prev) => prev.filter((t) => t.id !== id));

    pushToast({
      type: "danger",
      title: "Task deleted",
      message: task?.title ?? "Task removed.",
    });

    try {
      await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // rollback if delete fails
      if (task) setTasks((prev) => [task, ...prev]);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-950 text-white">
      <CursorGlow />

      {/* ✅ Toasts */}
      <div className="fixed right-4 top-4 z-[9999] space-y-2 w-[320px] max-w-[90vw]">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 30, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 30, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className={cn(
                "rounded-2xl border px-4 py-3 backdrop-blur-xl shadow-xl",
                toastStyles(t.type)
              )}
            >
              <p className="font-medium text-sm">{t.title}</p>
              {t.message ? (
                <p className="text-xs opacity-80 mt-0.5">{t.message}</p>
              ) : null}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* background glow */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-black" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120vh] h-[60vh] rounded-b-full bg-sky-400/10 blur-[90px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[100vh] h-[100vh] rounded-t-full bg-cyan-300/10 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Top bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white/80" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">FocusFlow Dashboard</h1>
              <p className="text-white/60 text-sm">
                Stay focused. Flow through tasks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-full h-11 rounded-2xl border border-white/10 bg-white/5 pl-10 pr-3 text-sm outline-none focus:border-white/20 focus:bg-white/10 transition"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openAdd}
              className="h-11 px-4 rounded-2xl bg-white text-black font-medium flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </motion.button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {pageLoading ? (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-lg"
                >
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16 mt-3" />
                </div>
              ))}
            </>
          ) : (
            <>
              <StatCard
                title="Total Tasks"
                value={stats.total}
                icon={<Circle className="w-4 h-4" />}
              />
              <StatCard
                title="Active"
                value={stats.active}
                icon={<Flag className="w-4 h-4" />}
              />
              <StatCard
                title="Completed"
                value={stats.completed}
                icon={<CheckCircle2 className="w-4 h-4" />}
              />
              <StatCard
                title="High Priority"
                value={stats.high}
                icon={<Flag className="w-4 h-4" />}
              />
            </>
          )}
        </div>

        {/* Controls */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            {(["all", "active", "completed"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={cn(
                  "px-4 h-10 rounded-2xl text-sm border transition",
                  filter === k
                    ? "bg-white text-black border-white"
                    : "bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                {k === "all" ? "All" : k === "active" ? "Active" : "Completed"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortBy("date")}
              className={cn(
                "px-4 h-10 rounded-2xl text-sm border transition flex items-center gap-2",
                sortBy === "date"
                  ? "bg-white/10 border-white/20"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              )}
            >
              <Calendar className="w-4 h-4 text-white/60" />
              Date
            </button>

            <button
              onClick={() => setSortBy("priority")}
              className={cn(
                "px-4 h-10 rounded-2xl text-sm border transition flex items-center gap-2",
                sortBy === "priority"
                  ? "bg-white/10 border-white/20"
                  : "bg-white/5 border-white/10 hover:bg-white/10"
              )}
            >
              <Flag className="w-4 h-4 text-white/60" />
              Priority
            </button>

            <button
              onClick={() => {
                clearAuthToken();
                window.location.href = "/signin";
              }}
              className="px-4 h-10 rounded-2xl text-sm border bg-white/5 border-white/10 hover:bg-white/10 transition flex items-center gap-2 text-white/80"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Task List */}
        <div className="mt-6 space-y-3">
          {pageLoading ? (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 w-full">
                      <Skeleton className="h-5 w-5 rounded-full mt-1" />
                      <div className="w-full">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/2 mt-2" />
                        <div className="mt-3 flex gap-2">
                          <Skeleton className="h-6 w-20 rounded-full" />
                          <Skeleton className="h-6 w-24 rounded-full" />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Skeleton className="h-10 w-10 rounded-2xl" />
                      <Skeleton className="h-10 w-10 rounded-2xl" />
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <AnimatePresence>
              {processed.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center"
                >
                  <p className="text-white font-medium">No tasks found</p>
                  <p className="text-white/60 text-sm mt-1">
                    Add a new task to start tracking your work.
                  </p>
                </motion.div>
              ) : (
                processed.map((task) => (
                  <motion.div
                    data-interactive="true"
                    layout
                    key={task.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4",
                      task.completed && "opacity-80"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleComplete(task.id)}
                          className="mt-1 text-white/70 hover:text-white transition"
                        >
                          {task.completed ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>

                        <div>
                          <p
                            className={cn(
                              "text-white font-medium",
                              task.completed && "line-through text-white/50"
                            )}
                          >
                            {task.title}
                          </p>

                          {task.description ? (
                            <p className="text-white/60 text-sm mt-1">
                              {task.description}
                            </p>
                          ) : null}

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span
                              data-priority={task.priority}
                              className={cn(
                                "text-xs px-2 py-1 rounded-full border",
                                priorityClasses[task.priority]
                              )}
                            >
                              {priorityLabel[task.priority]}
                            </span>

                            <span className="text-xs text-white/60">
                              Due: {formatDate(task.dueDate)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(task)}
                          className="h-10 w-10 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition flex items-center justify-center"
                        >
                          <Pencil className="w-4 h-4 text-white/70" />
                        </button>

                        <button
                          onClick={() => deleteTask(task.id)}
                          className="h-10 w-10 rounded-2xl border border-white/10 bg-white/5 hover:bg-rose-500/10 transition flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4 text-white/70" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal open={open} onClose={closeModal}>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-white">
            {editTask ? "Edit Task" : "Add Task"}
          </h2>
          <p className="text-white/60 text-sm mt-1">
            Keep your workflow smooth and focused.
          </p>

          <form onSubmit={saveTask} className="mt-5 space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-white/70">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Eg: Finish dashboard UI"
                className="w-full h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm outline-none focus:border-white/20 focus:bg-white/10 transition"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-white/70">Description</label>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Optional..."
                rows={3}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-white/20 focus:bg-white/10 transition resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="text-xs text-white/70">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm outline-none focus:border-white/20 focus:bg-white/10 transition"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs text-white/70">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm outline-none focus:border-white/20 focus:bg-white/10 transition"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="w-full h-11 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-white/80"
              >
                Cancel
              </button>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                className="w-full h-11 rounded-2xl bg-white text-black font-medium"
              >
                {editTask ? "Save Changes" : "Create Task"}
              </motion.button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
