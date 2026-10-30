package com.example.todo.task;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {
    @Mock
    private TaskRepository taskRepository;

    @InjectMocks
    private TaskService taskService;

    @Test
    void createTrimsFieldsAndDefaultsMissingDescription() {
        TaskRequest request = new TaskRequest("  Buy groceries  ", null, false, TaskPriority.HIGH);
        when(taskRepository.save(org.mockito.ArgumentMatchers.any(Task.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Task task = taskService.create(request);

        assertEquals("Buy groceries", task.getTitle());
        assertEquals("", task.getDescription());
        assertEquals(TaskPriority.HIGH, task.getPriority());
    }

    @Test
    void toggleFlipsCompletion() {
        Task task = new Task("Plan the week", "", TaskPriority.MEDIUM);
        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));
        when(taskRepository.save(task)).thenReturn(task);

        assertTrue(taskService.toggle(1L).isCompleted());
        assertFalse(taskService.toggle(1L).isCompleted());
    }

    @Test
    void missingTaskIsReported() {
        when(taskRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(TaskNotFoundException.class, () -> taskService.findById(99L));
        verify(taskRepository).findById(99L);
    }
}
