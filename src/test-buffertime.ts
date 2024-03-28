import { Observable, from, interval, of } from 'rxjs';
import { windowTime, mergeAll, count, take, mergeMap, groupBy, toArray, bufferTime, tap, reduce, map } from 'rxjs/operators';

const colors = [
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'white',
  'gray',
  'black',
];

interface Payload {
  color: string;
  x: number;
}

// const createEventDelay = 100; // 100ms (10 events per second)
const createEventDelay = 20; // 20ms (50 events per second)
// const createEventDelay = 10; // 10ms (100 events per second)
console.log(`createEventDelay: ${createEventDelay}ms`);

// Create a stream of events
const eventStream = new Observable<Payload>((subscriber) => {
  let count = 0;
  setInterval(() => {
    const random = colors[Math.floor(Math.random() * colors.length)];
    subscriber.next({
      color: random,
      x: count++
    });
  }, createEventDelay);
});

// Use the windowTime operator to create windows, then count each window
const windowDurationSeconds = 15;
const bufferDurationSeconds = 5;
const windowDurationMs = windowDurationSeconds * 1000;
const bufferDurationMs = bufferDurationSeconds * 1000;

const eventCountStream = eventStream.pipe(
  windowTime(windowDurationMs),
  mergeMap(window => window.pipe(count()))
);

// Subscribe to the event count stream
eventCountStream.subscribe((count) => {
  console.log(new Date().toISOString());
  console.log(`50 * 60 should be ${50 * 60} events`);
  console.log(`windowTime() Events per ${windowDurationSeconds} seconds: ${count}`);
});

// const eventGroupStream = eventStream.pipe(
//   groupBy(window => window.color),
//   windowTime(windowDuration),
//   mergeMap(window => window.pipe(count()))
// );

// this works well for grouping and counting, but no name
// const eventGroupStream = eventStream.pipe(
//   windowTime(windowDuration),
//   mergeMap(window => window.pipe(
//     groupBy(window => window.color),
//     mergeMap(windowGroup => windowGroup.pipe(
//       count()
//     )),
//   ))
// );

const groupByField = 'color';

//this works for window, group, count, and output name/value pairs!
// const eventGroupStream2 = eventStream.pipe(
//   windowTime(windowDurationMs),
//   mergeMap(window => window.pipe(
//     groupBy(window => window[groupByField]),
//     mergeMap(windowGroup => windowGroup.pipe(
//       toArray(),
//       mergeMap(items => {
//         const groupName = windowGroup.key;
//         const count = items.length;
//         return of({ groupName, count });
//       })
//       //count()
//     )),
//   ))
// );

// Buffertime Works!!
const eventGroupStream = eventStream.pipe(
    bufferTime(windowDurationMs, bufferDurationMs),
    //tap(x => console.log(x)),
    //mergeMap(buffer => from(buffer)),
    //tap(x => console.log(x)),
    tap(x => console.log(`bufferTime() tap ${new Date().toISOString()}`)),
    mergeMap(window => from(window).pipe(
      groupBy(window => window[groupByField]),
      mergeMap(windowGroup => windowGroup.pipe(
        //toArray(),
        // mergeMap(items => {
        //   const groupName = windowGroup.key;
        //   const count = items.length;
        //   return of({ groupName, count });
        // })
        //count()
        reduce((acc, curr) => acc + 1, 0),
        map(counter => ({ key: windowGroup.key, count: counter }))
      )),
    ))
  );

// not working, but close
// const eventGroupStream = eventStream.pipe(
//   windowTime(windowDuration),
//   mergeMap(window => window.pipe(
//     groupBy(window => window.color),
//     mergeMap(group$ => {
//       group$.pipe(
//         toArray(),
//         mergeMap(items => {
//           const groupName = group$.key;
//           const count = items.length;
//           return of({ groupName, count });
//         })
//       )
//     }),
//   ))
// );

// Subscribe to the grouped stream
eventGroupStream.subscribe((event) => {
  console.log(event);
});

// Subscribe to the full stream
// eventStream.subscribe((event) => {
//   console.log(event);
// });

console.log('RxJS groupBy routine starting...');
console.log(`Window: ${windowDurationSeconds}s`);
console.log(`Buffer: ${bufferDurationSeconds}s`);
console.log(`Group By Field: ${groupByField}`);
