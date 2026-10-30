package com.example.todo.task;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class TaskService {
    private final TaskRepository taskRepository;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    @Transactional(readOnly = true)
    public List<Task> findAll() {
        return taskRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Task findById(Long id) {
        return taskRepository.findById(id).orElseThrow(() -> new TaskNotFoundException(id));
    }

    public Task create(TaskRequest request) {
        Task task = new Task(request.title().trim(), normalizeDescription(request.description()), request.priority());
        task.setCompleted(request.completed());
        task.setReminderAt(parseReminder(request.reminderAt()));
        return taskRepository.save(task);
    }

    public Task update(Long id, TaskRequest request) {
        Task task = findById(id);
        task.setTitle(request.title().trim());
        task.setDescription(normalizeDescription(request.description()));
        task.setCompleted(request.completed());
        task.setPriority(request.priority());
        task.setReminderAt(parseReminder(request.reminderAt()));
        return taskRepository.save(task);
    }

    public Task toggle(Long id) {
        Task task = findById(id);
        task.setCompleted(!task.isCompleted());
        return taskRepository.save(task);
    }

    public void delete(Long id) {
        taskRepository.delete(findById(id));
    }

    private String normalizeDescription(String description) {
        return description == null ? "" : description.trim();
    }

    private java.time.Instant parseReminder(String reminderAt) {
        if (reminderAt == null || reminderAt.isBlank()) {
            return null;
        }
        return java.time.Instant.parse(reminderAt);
    }
}
