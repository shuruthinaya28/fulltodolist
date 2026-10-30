package com.example.todo.task;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TaskRequest(
        @NotBlank @Size(max = 120) String title,
        @Size(max = 1000) String description,
        boolean completed,
        @NotNull TaskPriority priority,
        String reminderAt) {

    public TaskRequest(
            @NotBlank @Size(max = 120) String title,
            @Size(max = 1000) String description,
            boolean completed,
            @NotNull TaskPriority priority) {
        this(title, description, completed, priority, null);
    }
}
