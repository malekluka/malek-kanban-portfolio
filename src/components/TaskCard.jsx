import React, { useState, useEffect, useCallback } from "react";
import {
  MoreHorizontal,
  Calendar,
  Clock,
  Trash,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function TaskCard({
  task,
  columnId,
  editingTask,
  setEditingTask,
  updateTask,
  deleteTask,
  handleDragStart,
  handleDragEnd,
  getPriorityColor,
  onStatusChange, // New prop to notify parent of status changes
}) {
  const isEditing =
    editingTask &&
    editingTask.columnId === columnId &&
    editingTask.taskId === task.id;
  const [form, setForm] = useState({
    title: task.title,
    description: task.description,
    priority: task.priority || "medium",
    dueDate: task.dueDate || "",
    tags: (task.tags || []).join(", "),
    assigneeName: task.assignee?.name || "",
    assigneeInitials: task.assignee?.initials || "",
    assigneeColor: task.assignee?.color || "from-gray-400 to-gray-500",
    status: task.status || "todo",
  });

  // Separate state for subtasks management
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [localSubtasks, setLocalSubtasks] = useState(
    task.subtasks?.items || []
  );
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  // Quick status change (without opening full editor)
  const [showQuickStatus, setShowQuickStatus] = useState(false);
  useEffect(() => {
  if (!showQuickStatus) return;

  const handleClickOutside = () => setShowQuickStatus(false);
  document.addEventListener("click", handleClickOutside);

  return () => document.removeEventListener("click", handleClickOutside);
}, [showQuickStatus]);


  useEffect(() => {
    setForm({
      title: task.title,
      description: task.description,
      priority: task.priority || "medium",
      dueDate: task.dueDate || "",
      tags: (task.tags || []).join(", "),
      assigneeName: task.assignee?.name || "",
      assigneeInitials: task.assignee?.initials || "",
      assigneeColor: task.assignee?.color || "from-gray-400 to-gray-500",
      status: task.status || "todo",
    });
    setLocalSubtasks(task.subtasks?.items || []);
  }, [task]);
  

  const handleSave = () => {
    const oldStatus = task.status;
    const updated = {
      title: form.title,
      description: form.description,
      priority: form.priority,
      dueDate: form.dueDate,
      tags: form.tags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      assignee: {
        name: form.assigneeName || "Unassigned",
        initials:
          form.assigneeInitials ||
          (form.assigneeName
            ? form.assigneeName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()
            : "UN"),
        color: form.assigneeColor || "from-gray-400 to-gray-500",
      },
      status: form.status,
      subtasks:
        localSubtasks.length > 0
          ? {
              items: localSubtasks,
              total: localSubtasks.length,
              completed: localSubtasks.filter((st) => st.done).length,
            }
          : null,
    };

    updateTask(columnId, task.id, updated);

    // Notify parent if status changed
    if (oldStatus !== form.status && onStatusChange) {
      onStatusChange(columnId, task.id, oldStatus, form.status);
    }

    setEditingTask(null);
  };


 const handleCancel = useCallback(() => {
    setForm({
      title: task.title,
      description: task.description,
      priority: task.priority || "medium",
      dueDate: task.dueDate || "",
      tags: (task.tags || []).join(", "),
      assigneeName: task.assignee?.name || "",
      assigneeInitials: task.assignee?.initials || "",
      assigneeColor: task.assignee?.color || "from-gray-400 to-gray-500",
      status: task.status || "todo",
    });
    setLocalSubtasks(task.subtasks?.items || []);
    setEditingTask(null);
  }, [task, setEditingTask]);
  
  useEffect(() => {
    if (!isEditing) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isEditing, handleCancel]);

  // Quick status change
  const handleQuickStatusChange = (newStatus) => {
    const oldStatus = task.status;
    updateTask(columnId, task.id, { status: newStatus });

    if (onStatusChange) {
      onStatusChange(columnId, task.id, oldStatus, newStatus);
    }

    setShowQuickStatus(false);
  };

  // Subtask management
  const addSubtask = () => {
    if (!newSubtaskTitle.trim()) return;

    const newSubtask = {
      id: Date.now().toString(),
      title: newSubtaskTitle.trim(),
      done: false,
    };

    setLocalSubtasks((prev) => [...prev, newSubtask]);
    setNewSubtaskTitle("");
  };

  const toggleSubtask = (subtaskId) => {
    setLocalSubtasks((prev) =>
      prev.map((st) => (st.id === subtaskId ? { ...st, done: !st.done } : st))
    );
  };

  const removeSubtask = (subtaskId) => {
    setLocalSubtasks((prev) => prev.filter((st) => st.id !== subtaskId));
  };

  // Calculate progress
 const progressPercent = (() => {
  const subtasksSource = isEditing
    ? localSubtasks
    : task.subtasks?.items || [];

  if (subtasksSource.length > 0) {
    const completed = subtasksSource.filter((st) => st.done).length;
    return Math.round((completed / subtasksSource.length) * 100);
  }

  const statusMap = { todo: 0, "in-progress": 50, done: 100 };
  return statusMap[task.status] || 0;
})();


  const getStatusColor = (status) => {
    const colors = {
      todo: "text-gray-500 bg-gray-100",
      "in-progress": "text-blue-700 bg-blue-100",
      done: "text-green-700 bg-green-100",
    };
    return colors[status] || colors.todo;
  };

  const getStatusLabel = (status) => {
    const labels = {
      todo: "To Do",
      "in-progress": "In Progress",
      done: "Done",
    };
    return labels[status] || "To Do";
  };

  return (
    <div
      className="w-full group rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing hover:scale-[1.02]"
      draggable={!isEditing}
      onDragStart={(e) => !isEditing && handleDragStart(e, task, columnId)}
      onDragEnd={handleDragEnd}
      onClick={() =>
        !isEditing && setEditingTask({ columnId, taskId: task.id })
      }
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          {isEditing ? (
            <input
              className="w-full bg-transparent font-semibold text-sm outline-none border-b border-border pb-1"
              value={form.title}
              onChange={(e) =>
                setForm((s) => ({ ...s, title: e.target.value }))
              }
              placeholder="Task title..."
            />
          ) : (
            <h3 className="font-semibold text-sm leading-tight text-card-foreground pr-2">
              {task.title}
            </h3>
          )}

          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isEditing && (
              <div className="relative">
                <button
                  className={`text-xs px-2 py-1 rounded-full transition-all ${getStatusColor(
                    task.status
                  )}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowQuickStatus(!showQuickStatus);
                  }}
                >
                  {getStatusLabel(task.status)}
                </button>
                {showQuickStatus && (
                  <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-10 min-w-32">
                    {["todo", "in-progress", "done"].map((status) => (
                      <button
                        key={status}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickStatusChange(status);
                        }}
                      >
                        {getStatusLabel(status)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <button
              className="text-muted-foreground hover:text-card-foreground p-1 rounded-md hover:bg-accent transition-all"
              onClick={(e) => {
                e.stopPropagation();
                setEditingTask({ columnId, taskId: task.id });
              }}
            >
              <MoreHorizontal size={14} />
            </button>
            <button
              className="text-destructive hover:text-destructive/90 p-1 rounded-md hover:bg-destructive/10 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                deleteTask(columnId, task.id);
              }}
            >
              <Trash size={14} />
            </button>
          </div>
        </div>

        {isEditing ? (
          /* Full Editor */
          <div className="space-y-4">
            <div className="max-h-32 overflow-y-auto">
              <textarea
                className="w-full bg-transparent text-sm outline-none resize-none border-b border-border pb-2"
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((s) => ({ ...s, description: e.target.value }))
                }
                placeholder="Task description..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  className="w-full text-sm bg-transparent outline-none border-b border-border pb-1"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, dueDate: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  Priority
                </label>
                <select
                  value={form.priority}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, priority: e.target.value }))
                  }
                  className="w-full text-sm bg-transparent outline-none border-b border-border pb-1"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Tags
              </label>
              <input
                className="w-full bg-transparent text-sm outline-none border-b border-border pb-1"
                placeholder="Tags (comma separated)"
                value={form.tags}
                onChange={(e) =>
                  setForm((s) => ({ ...s, tags: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Assignee
              </label>
              <input
                className="w-full bg-transparent text-sm outline-none border-b border-border pb-1"
                placeholder="Assignee name"
                value={form.assigneeName}
                onChange={(e) =>
                  setForm((s) => ({ ...s, assigneeName: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-1">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((s) => ({ ...s, status: e.target.value }))
                }
                className="w-full text-sm bg-transparent outline-none border-b border-border pb-1"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            {/* Subtasks Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-muted-foreground">
                  Subtasks
                </label>
                <button
                  onClick={() => setShowSubtasks(!showSubtasks)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  {showSubtasks ? (
                    <ChevronUp size={12} />
                  ) : (
                    <ChevronDown size={12} />
                  )}
                  {localSubtasks.length > 0 &&
                    `(${localSubtasks.filter((st) => st.done).length}/${
                      localSubtasks.length
                    })`}
                </button>
              </div>

              {showSubtasks && (
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-2 bg-gray-50">
                  {localSubtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={subtask.done}
                        onChange={() => toggleSubtask(subtask.id)}
                      />
                      <span
                        className={`text-sm flex-1 ${
                          subtask.done
                            ? "line-through text-muted-foreground"
                            : ""
                        }`}
                      >
                        {subtask.title}
                      </span>
                      <button
                        onClick={() => removeSubtask(subtask.id)}
                        className="text-destructive hover:text-destructive/90 p-1"
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      placeholder="Add subtask..."
                      className="flex-1 text-sm bg-transparent outline-none border-b border-border pb-1"
                      onKeyDown={(e) => e.key === "Enter" && addSubtask()}
                    />
                    <button
                      onClick={addSubtask}
                      className="text-primary hover:text-primary/90 p-1"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button
                onClick={handleCancel}
                className="text-sm text-muted-foreground px-3 py-1 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="text-sm bg-primary text-primary-foreground px-3 py-1 rounded hover:bg-primary/90"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          /* Display Mode */
          <>
            <div className="max-h-20 overflow-y-auto mb-3">
              <p className="text-muted-foreground text-xs leading-relaxed">
                {task.description}
              </p>
            </div>

            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Progress</span>
                <span className="text-xs text-muted-foreground">
                  {progressPercent}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {task.subtasks && task.subtasks.total > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  {task.subtasks.completed} of {task.subtasks.total} subtasks
                  completed
                </div>
              )}
            </div>

            {/* Meta Information */}
            <div className="flex items-center justify-between mb-3">
              <span
                className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium border ${getPriorityColor(
                  task.priority || "medium"
                )}`}
              >
                {task.priority || "medium"}
              </span>
              {task.dueDate && (
                <div className="flex items-center space-x-1 text-muted-foreground">
                  <Calendar size={12} />
                  <span className="text-xs">{task.dueDate}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-6 h-6 bg-gradient-to-br ${
                    task.assignee?.color || "from-gray-400 to-gray-500"
                  } rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm`}
                >
                  {task.assignee?.initials || "UN"}
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {task.assignee?.name || "Unassigned"}
                </span>
              </div>

              <div className="flex items-center space-x-3 text-muted-foreground">
                {task.subtasks && task.subtasks.total > 0 && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span className="text-xs">
                      {task.subtasks.completed}/{task.subtasks.total}
                    </span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Clock size={12} />
                  <span className="text-xs">{task.comments || 0}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
