import { ref } from 'vue';

type EventName = 'urlShortened' | string; // Add other event names as needed
type CallbackFunction = (...args: any[]) => void;

interface EventBus {
  on: (event: EventName, callback: CallbackFunction) => void;
  off: (event: EventName, callback: CallbackFunction) => void;
  emit: (event: EventName, ...args: any[]) => void;
}

const PENDING = Symbol('pending'); // Unique symbol for pending state
const eventBusState = ref<EventBus | typeof PENDING>(PENDING);

export function useEventBus(): EventBus {
  if (eventBusState.value === PENDING) {
    const events = new Map<EventName, Set<CallbackFunction>>();

    const on: EventBus['on'] = (event, callback) => {
      if (!events.has(event)) {
        events.set(event, new Set());
      }
      events.get(event)!.add(callback);
    };

    const off: EventBus['off'] = (event, callback) => {
      if (events.has(event)) {
        events.get(event)!.delete(callback);
        if (events.get(event)!.size === 0) {
          events.delete(event);
        }
      }
    };

    const emit: EventBus['emit'] = (event, ...args) => {
      if (events.has(event)) {
        events.get(event)!.forEach(callback => callback(...args));
      }
    };
    eventBusState.value = { on, off, emit };
  }
  return eventBusState.value as EventBus;
}

// Optional: Plugin to inject $eventBus globally if needed by other modules/components
// You can create a plugin file e.g., `plugins/eventBus.ts`
/*
import { useEventBus } from '~/composables/useEventBus';

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.provide('eventBus', useEventBus());
});
*/