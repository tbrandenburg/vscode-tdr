export interface Observer {
    update: (data:any) => void;
}

export abstract class Observable {
    private observers: Observer[] = [];
  
    public addObserver(observer: Observer) {
      this.observers.push(observer);
    }
  
    public removeObserver(observer: Observer) {
      const index = this.observers.indexOf(observer);
      if (index !== -1) {
        this.observers.splice(index, 1);
      }
    }
  
    public notifyObservers(data: any) {
      for (const observer of this.observers) {
        observer.update(data);
      }
    }
  }