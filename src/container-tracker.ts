export interface ContainerState {
  element: Element | null;
  isReady: boolean;
  isMounted: boolean;
}

export interface ContainerTracker {
  waitForContainer: (containerId: string) => Promise<Element>;
  getContainerState: (containerId: string) => ContainerState;
  subscribe: (containerId: string, callback: (state: ContainerState) => void) => () => void;
}

class ContainerTrackerImpl implements ContainerTracker {
  private containers = new Map<string, ContainerState>();
  private subscribers = new Map<string, Set<(state: ContainerState) => void>>();
  private waiters = new Map<
    string,
    Array<{
      resolve: (element: Element) => void;
      reject: (error: Error) => void;
    }>
  >();

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    window.addEventListener("app-container-ready", ((event: CustomEvent) => {
      const { containerId, action, container } = event.detail;

      if (action === "mount") {
        this.handleContainerMount(containerId, container);
      } else if (action === "unmount") {
        this.handleContainerUnmount(containerId);
      }
    }) as EventListener);
  }

  private handleContainerMount(containerId: string, container: Element) {
    const state: ContainerState = {
      element: container,
      isReady: true,
      isMounted: true,
    };

    this.containers.set(containerId, state);

    // Уведомляем всех ожидающих
    const waiters = this.waiters.get(containerId);
    if (waiters) {
      waiters.forEach(({ resolve }) => resolve(container));
      this.waiters.delete(containerId);
    }

    // Уведомляем подписчиков
    this.notifySubscribers(containerId, state);
  }

  private handleContainerUnmount(containerId: string) {
    const currentState = this.containers.get(containerId);
    if (currentState) {
      const newState: ContainerState = {
        element: null,
        isReady: false,
        isMounted: false,
      };

      this.containers.set(containerId, newState);

      // Уведомляем подписчиков
      this.notifySubscribers(containerId, newState);
    }
  }

  private notifySubscribers(containerId: string, state: ContainerState) {
    const containerSubscribers = this.subscribers.get(containerId);
    if (containerSubscribers) {
      containerSubscribers.forEach((callback) => {
        try {
          callback(state);
        } catch (error) {
          console.error("Error in container subscriber callback:", error);
        }
      });
    }
  }

  waitForContainer(containerId: string): Promise<Element> {
    return new Promise((resolve, reject) => {
      // Проверяем текущее состояние
      const currentState = this.getContainerState(containerId);
      if (currentState.isReady && currentState.element) {
        resolve(currentState.element);
        return;
      }

      // Добавляем в очередь ожидания
      if (!this.waiters.has(containerId)) {
        this.waiters.set(containerId, []);
      }
      this.waiters.get(containerId)!.push({ resolve, reject });
    });
  }

  getContainerState(containerId: string): ContainerState {
    return (
      this.containers.get(containerId) || {
        element: null,
        isReady: false,
        isMounted: false,
      }
    );
  }

  subscribe(containerId: string, callback: (state: ContainerState) => void): () => void {
    if (!this.subscribers.has(containerId)) {
      this.subscribers.set(containerId, new Set());
    }

    this.subscribers.get(containerId)!.add(callback);

    // Сразу вызываем callback с текущим состоянием
    const currentState = this.getContainerState(containerId);
    callback(currentState);

    // Возвращаем функцию для отписки
    return () => {
      const containerSubscribers = this.subscribers.get(containerId);
      if (containerSubscribers) {
        containerSubscribers.delete(callback);
        if (containerSubscribers.size === 0) {
          this.subscribers.delete(containerId);
        }
      }
    };
  }
}

export const containerTracker = new ContainerTrackerImpl();
