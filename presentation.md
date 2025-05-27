---
title: "Advanced Angular (for Kadaster)"

---

## Advanced Angular

## Kadaster

---

### Expectations today

Note: We'll consider a case, then we'll dive into some (relevant) theory and modern best-practices, followed by some examples and possible experiments we can do. This means, today will be interactive by discussing together; but also experimenting with some ideas with our actual code!

----

## Goals

Note: Any goals from the audience? What would you hope to learn today? My take is: Generate ideas and actions for the team to take on. Input for future discussions, refinements and actions to undertake as a team. Make sure you have somewhere (in the repo later? Or a shared spot?) where you can write down any ideas and actions the team needs to discuss after in your opinion.

---

<div style="">
  <img src="./assets/bjorn-talk.webp" width="100" style="border-radius:100%; display: inline-flex;">
  <h1 style="font-size: 0.9em;">Bjorn Schijff</h1>
  <small style="display: inline-flex;">Sr. Frontend Engineer / Architect</small>
  <div>
    <img src="./assets/codestar.svg" height="30" style="border: 0; background-color: transparent;">
  </div>
  <small>@Bjeaurn</small>
  <br />
  <small>bjorn.schijff@soprasteria.com</small>
</div>

Note: Quick introduction.

---

<img src="./assets/repo.svg" width="400" alt="QR code to repo" />

Note: Let's get the repository, but be mindful it mainly contains the example code I used, a link to Stackblitz and the presentation. It might be more interesting to try what we'll discuss locally on your actually repository. Maybe a good idea to make a little experimental branch?

---

## Let's get started 

----

Write down for yourself <br /><small>(NOTES.md, paper, comments...)</small>

- What are things that stand out?<!-- .element: class="fragment" -->
- What looks nice?<!-- .element: class="fragment" -->
- What might we want to improve?<!-- .element: class="fragment" -->

<small class="fragment">`./code/project-detail/medewerkers-aanpassen/`</small>

Note: Make sure everyone can make notes. Get code (Medewerkers-aanpassen)[./code/project-detail/medewerkers-aanpassen/] on screen. We'll take 5-10 minutes to go through.

----

## Discuss

Note: Let's go over some of these points of attention, do we have shared concerns? Can we agree on parts that are nice?

---

<!-- [BLOCK] No functions in HTML -->

```ts
medewerkerIsCurrentGebruiker(verkorteGebruikersNaam: string): boolean {
    return this.gebruiker?.userName === verkorteGebruikersNaam;
}
```

```html
<button *ngIf="
    !medewerkerIsCurrentGebruiker(
        addedMedewerkersFormArray.value[i].verkorteGebruikersNaam
    )"
    aria-label="Medewerker van project verwijderen."
    type="button"
    (click)="confirmMedewerkerDeletion(assignedGebruikersList![i])"
>X</button>
```
<!--- .element: class="fragment" -->

Note: Can anyone tell me what is wrong with this construction?

----

### Functions in HTML

- Trigger change detection often and unexpectedly
- Possible performance issues
- Bad practice

Exception when it comes to `signal()` !
<!-- .element: class="fragment" -->

<small>

[Angular.dev](https://angular.dev/guide/templates/pipes#creating-custom-pipes)

</small>

Note: Triggering a bunch of change detection, possibly creating performance issues when doing expensive calculations. Generally just bad practice. How can we proof that this is a bad idea? Exercise?

----

```ts
console.count('trigger')
```

Note: Easy to check how many times a function is being called, and how often. The above example works well with the example code in the Stackblitz.

----

## How to fix?

Note: Discuss first, then go over possible solutions.

----

### Pipes 

❌ Bad example

```ts
@Pipe({
  name: 'isCurrentUser',
  pure: false // <--- This is indicating this might be a bad idea!
})
// Naming convention to indicate overuse of this Pipe might be bad.
export class IsCurrentUserImpurePipe implements PipeTransform {

  //  private userStore = inject(userStore) <-- Don't do this. Makes it impure!

  transform(value: string): boolean {
    return value === this.userStore.currentUser
  }
}
```

----

### Pipes

✅ Good example

```ts
@Pipe({
  name: 'isCurrentUser',
  pure: true
})
export class IsCurrentUserPipe implements PipeTransform {
  transform(value: string, username: string): boolean {
    return value === username // Or whatever comparison logic makes sense here.
  }
}
```

```html
<!-- Usage example: -->
@if(item.naam | IsCurrentUser:currentUser.naam) {
    <button (click)="remove(item)">
        X
    </button>
}
```

Note: Free memoization! Only recalculated when one of the values changes! This example only compares 2 strings, so maybe a rename would work better here for reusability? ;-) Unless it contains more user specific logic.

----

### Read-optimize the model

```ts
addMedewerkerToList(medewerker) {
    // ...

    const medewerkersForm = this.formBuilder.group({
      verkorteGebruikersNaam: [ medewerker.verkorteGebruikersNaam, Validators.required, ],
      projectGebruikerRolWaarde: [null, Validators.required],
      isMe: [ // <-- For example! 
        { value: medewerker.verkorteGebruikersNaam === this.gebruiker?.userName, 
          disabled: true }, 
      ]
    });

    this.addedMedewerkersFormArray.push(medewerkersForm);
}
```

```html
 <button *ngIf="!addedMedewerkersFormArray.value[i].isMe">
```

Note: Calculate once, use everywhere. 

----

## Try it!

Note: Take some time (5-10m) to experiment with these options. Or perhaps we take a bigger block of time after this section to try multiple things at once. If we do this, go around the group and ask what they tried, what they found.

<!-- [/BLOCK] -->

---

<!-- [BLOCK] Smart vs. Presentational components -->

### Smart vs. Presentational

<small>
Resources:

[Angular University](https://blog.angular-university.io/angular-2-smart-components-vs-presentation-components-whats-the-difference-when-to-use-each-and-why/)

</small>


----

What is a presentational component? How does it differ from a "Smart" one?

Note: Who can explain to me the difference between Smart and Presentational components? Also mention smart vs. dumb components

----

```ts
@Component({
  standalone: true,
  selector: 'app-todo-list',
  imports: [CommonModule],
  template: `
    <ul>
      <li *ngFor="let todo of todos">
        <label>
          <input type="checkbox" [checked]="todo.done" (change)="toggle.emit(todo.id)" />
          {{ todo.title }}
        </label>
      </li>
    </ul>
  `
})
export class TodoListComponent {
  @Input() todos: Todo[] = [];
  @Output() toggle = new EventEmitter<number>();
}
```

----

```ts
@Component({
  standalone: true,
  selector: 'app-todo-list-container',
  imports: [TodoListComponent],
  template: `<app-todo-list [todos]="todos()" (toggle)="onToggle($event)" />`,
})
export class TodoListContainerComponent {
  private todoService = inject(TodoService);
  todos = signal(this.todoService.getTodos());

  onToggle(id: number) {
    this.todoService.toggleDone(id);
    this.todos.set(this.todoService.getTodos());
  }
}
```

----

## Benefits

- Seperation of Concerns<!-- .element: class="fragment" -->
- Improved testing<!-- .element: class="fragment" -->
- Reusability<!-- .element: class="fragment" -->
- Easier refactoring<!-- .element: class="fragment" -->
- More scalable architecture<!-- .element: class="fragment" -->

----

## Discuss

Note: Try it? Although a refactoring like this might take some additional time. Take 5-10 minutes to discuss if there's value in splitting this component into a more Presentational one? What's the downside?

<!-- [/BLOCK] -->

---

```ts
loadAllGebruikers() {
  this.loadAndSubscribeUnassignedGebruikers();
  this.loadAndSubscribeAssignedMedewerkers();
}
```

```ts
  /**
   * Wordt getriggered wanneer de modal opent.
   */
  initModal() {
    this.loadAllGebruikers();
  }
```
<!-- .element: class="fragment" -->

Note: Let's talk about this. Anyone knows how many times this is being called in the component by heart? Seems like there are no refresh mechanisms, no syncing with database in between actions, nothing like that.

----

<!-- [BLOCK] Data & Stream Management / Viewmodels -->
## Data management

### What do we actually need?
<!-- .element: class="fragment" -->

Note: So let us talk a bit about the data management for components like these. (Note; not directly talking about state management here, but that might factor into it) - What do we actually need to start/use our component? Discuss.

----

```ts
dataUnassigned$ = this.loadUnassignedGebruikers(this.projectNumber, this.projectTypeCode)

// Is there anything wrong with this?
```

Note: Is there anything wrong with this? (Think cold observables, takeUntilDestroyed perhaps).

----

```ts
dataUnassigned$ = this.loadUnassignedGebruikers(this.projectNumber, this.projectTypeCode)
                        .pipe(takeUntilDestroyed());

// What about now? 
// This is still considering that the underlying 
// call is possibly a Hot Observable and may emit more 
// then one value. Which it probably does not as it's 
// just a REST call? Let's take it a step further.
```

----

```ts
data$ = forkJoin([
          this.loadUnassignedGebruikers(this.projectNumber, this.projectTypeCode),
          this.loadAssignedMedewerkers(this.projectNumber, this.projectTypeCode)  
        ]).pipe(takeUntilDestroyed())

// data$ is now of type Observable<[Gebruikers[], Medewerkers[]]>
```

----

>...Lastly, if you are working with observables that only emit one value, or you only require the last value of each before completion, forkJoin is likely a better option.

<small>
Resources:

https://www.learnrxjs.io/learn-rxjs/operators/combination/forkjoin#why-use-forkjoin
https://www.learnrxjs.io/learn-rxjs/operators/combination/combinelatest

</small>

Note: forkJoin vs. combineLatest - 

----

### What about the component assignments we have to do?

```ts
initializeAssignedMedewerkers()
mapAssignedMedewerkers()
```
<!-- .element: class="fragment" -->

Note: What do we do with these (imperatively called) functions? How could we make sure we are preparing and building the component state in the correct way so we can present it correctly to our user?

----

```ts
// One possible solution?
data$ = forkJoin([
          this.loadUnassignedGebruikers(this.projectNumber, this.projectTypeCode)
            .pipe(),
          this.loadAssignedMedewerkers(this.projectNumber, this.projectTypeCode)
            .pipe(
              map(this.mapAssignedMedewerkers),
              tap(this.initializeAssignedMedewerkers),
            )  
        ]).pipe(takeUntilDestroyed())
```

Note: Might have to rewrite the initialize functions to not rely on internal state (imperative!) but to be passed the correct values directly.

----

```ts
// Alternatively
unassignedGebruikers$ = this.loadUnassignedGebruikers(this.projectNumber, this.projectTypeCode)
  .pipe(takeUntilDestroyed())

assignedGebruikers$ = this.loadAssignedMedewerkers(this.projectNumber, this.projectTypeCode)
  .pipe(
    takeUntilDestroyed(),
    map(this.mapAssignedMedewerkers),
    tap(this.initializeAssignedMedewerkers)
  )

data$ = forkJoin([this.unassignedGebruikers$, this.assignedGebruikers$])
```

Note: Might even be cleaner and more declarative! Be aware that if you "branch" off multiple streams from the original assignedGebruikers$, that these observables are now cold and will create a new one for each subscription.

----

## Signals

Note: Let's make the move into modern state management as recommended by the framework itself. See if we can reduce some of this RxJS complexity for this particular case.

----

```ts
// Assuming we use the data$ Observable from earlier examples.
data = toSignal(this.data$)

// data = [Gebruikers[], Medewerkers[]]
unassignedGebruikers = linkedSignal(() => this.data()[0])
assignedGebruikers = linkedSignal(() => this.data()[1])

// https://angular.dev/guide/signals/linked-signal (Preview since v19)
// This also takes care of our subscriptions!
// And refreshing our data() signal will keep our gebruikers up to date!
```

Note: This should make our entire workflow reactive, and we can just rewrite the logic that updates either unassigned or assigned. We could even make that more reactive by making it one list and toggling between "Assigned" and "Unassigned"

----

```ts
// Theoretical approach
allUsers = toSignal(mergeMap([
  this.loadUnassignedGebruikers()
    .pipe(map()), 
  this.loadAssignedMedewerkers()
    .pipe(map())
  ]).pipe(takeUntilDestroyed(), tap()))

assignedUsers = computed(() => this.allUsers().filter(user => user.isAssigned === true))
unassignedUsers = computed() => this.allUsers().filter(user => user.isAssigned === false))
```

Note: This gives you easy access to the different signals containing your assigned and unassigned users, if we make it easy to distinguish them in our "allUsers()" stream. If we turn the allUsers signal into a LinkedSignal(), we can even update its internal state and flip people's "isAssigned" flag in a centrally managed piece of logic.

----

# Try it!

Note: Let's take 10-15-20m to see if we can easily build up (part) of the initialization into an Observable? Can we turn it into a Signal too? Can we see how this also ties into the Presentational vs. Smart/Container component discussion? Let people show & tell what they did after.
<!-- [/BLOCK] -->

---

<!-- [BLOCK] (Component) Testing -->
# Testing

Note: Let's put our final attention towards testing. What is the main goal or focus of testing? Disclaimer - not able to run tests in Stackblitz, might have to rely on local installations? (No real working examples prepped?)

----

Resources: 

- [angular.dev Testing Components Basics](https://angular.dev/guide/testing/components-basics)
- [angular.dev Service Testing](https://angular.dev/guide/testing/services)

----

## Component testing

- Test "what" the user wants to do<!-- .element: class="fragment" -->
- Assert on HTML<!-- .element: class="fragment" -->
- Not really interested in "how"<!-- .element: class="fragment" -->

Note: Testing what vs how. Focus on User behavior and what they interact with (HTML).

----

### Component testing tools

`fixture.nativeElement`

`fixture.debugElement.nativeElement`
<!-- .element: class="fragment" -->

`fixture.nativeElement.querySelector()`
<!-- .element: class="fragment" -->

`fixture.nativeElement.query(By.css())`
<!-- .element: class="fragment" -->

----

### Component Lifecycle

`fixture.detectChanges()`

```ts
  providers: [{
    provide: ComponentFixtureAutoDetect, 
    useValue: true
  }],
```
<!-- .element: class="fragment" -->

<small class="fragment">

Resource: [Component Scenarios](https://angular.dev/guide/testing/components-scenarios#detectchanges)
</small>

Note: DetectChanges() runs the Angular lifecycle first, so things like ngOnInit() get called here too automatically. We can opt-in to automatic change detection by the framework like it does in production.

----

```ts
const nameInput: HTMLInputElement = hostElement.querySelector('input')!;      
// simulate user entering a new name into the input box
nameInput.value = 'First Name';      

// Dispatch a DOM event so that Angular learns of input value change.
nameInput.dispatchEvent(new Event('input'));
```

Note: This way we can actually make assertions about how a user would interact with out application/components. This way we can test if, given some behavior, the correct things are being called/emitted/retrieved etc.

<!-- [/BLOCK] -->

----

## Let's consider our current case

Note: Let's go back to our `medewerkers-aanpassen.component.ts` and its existing .spec file. What do we see? What could we approach differently?

----

# Try it!

Note: Take 15-20 minutes to maybe write some new tests in a separate describe()? Or copy/paste it and clean it up to see what tests are actually useful? Don't forget at the end to give everyone time to explain and/or show what they've done.

---

<!-- [BLOCK] Shared routing state, short one -->
## Shared state (routing)

----

```ts
const projectSleutel = this.route.snapshot.params['projectSleutel'];
this.projectNumber = +projectSleutel.substring(projectSleutel.length - 4);
this.projectTypeCode = projectSleutel.substring(
  0,
  projectSleutel.length - 4
);
```

----

[withComponentInputBinding](https://angular.dev/api/router/withComponentInputBinding)

```ts
projectSleutel = input<string>()

ngOnInit() {  // Or later in the lifecycle, not available during constructor()
  console.log(this.projectSleutel())
}
```
<!-- .element: class="fragment" -->

Note: This can be enabled since Angular v16 (and is already on for our Stackblitz example). Might be a much easier way to deal with certain "reused" pieces of state being passed around. Move the functions that extract the needed data from the URL into a shared function that can be easily imported. Or use a service (that would need to be injected everywhere...). Pro's and Cons!

<!-- [/BLOCK] -->

---

Note: If we have time left, consider the other medewerkers-aanpassen component? How much does it differ from the case we've been talking about? What would be interesting things to consider now for the team to move this forward?

---

# Summary

Note: What did we learn? What actions do we define for our team? What parts do we need to invest more time in? Any particular parts that jumped out for you? Any ideas for what's next? Hope I helped!

---

## Thank you!

<div style="">
  <img src="./assets/bjorn.jpg" width="100" style="border-radius:100%; display: inline-flex;">
  <h1 style="font-size: 0.9em;">Bjorn Schijff</h1>
  <small style="display: inline-flex;">Sr. Frontend Engineer / Architect</small>
  <div>
    <img src="./assets/codestar.svg" height="30" style="border: 0; background-color: transparent;">
  </div>
  <small>@Bjeaurn</small>
  <br />
  <small>bjorn.schijff@soprasteria.com</small>
</div>
