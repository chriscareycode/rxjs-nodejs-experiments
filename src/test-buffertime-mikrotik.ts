import { Observable, Observer, from, interval, of } from 'rxjs';
import { windowTime, mergeAll, count, take, mergeMap, groupBy, toArray, bufferTime, tap, reduce, map, filter } from 'rxjs/operators';
import { WebSocket } from 'ws';

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

// Connect to upstream job
const upstreamUrl = `ws://127.0.0.1:4001`;
// Create an Observable
const websocketObservable = new Observable<string>((observer: Observer<string>) => {
    const socket = new WebSocket(upstreamUrl);
  
    // WebSocket open event
    socket.addEventListener('open', () => {
      console.log('WebSocket connected');
    });
  
    // WebSocket message event
    socket.addEventListener('message', (event) => {
      observer.next(event.data as string); // Type Buffer is not assigneable to type string
    });
  
    // WebSocket error event
    socket.addEventListener('error', (errorEvent) => {
      observer.error(errorEvent);
    });
  
    // WebSocket close event
    socket.addEventListener('close', () => {
      observer.complete();
    });
  
    // Cleanup function
    return () => {
      socket.close();
    };
  });

const eventStream = websocketObservable.pipe(
    tap(x => console.log(`websocketObservable() tap ${new Date().toISOString()}`, x)),
    map((logLine) => {
      let obj = null;

      try {
        obj = JSON.parse(logLine);
      } catch (e) {

      }
      if (obj && obj.message) {
        // parse the log line here to get the source IP address

        const arrowPos = obj.message.indexOf('->')
        if (arrowPos) {
          console.log(arrowPos);
          const subStr = obj.message.substr(0, arrowPos);
          console.log(subStr);
          const lastIndexOfSpace = subStr.lastIndexOf(' ');
          const ip = subStr.substr(lastIndexOfSpace + 1);
          console.log(ip);
  
          return {
            color: ip,
            x: 1,
          };
        } else {
          return {
            color: null,
            x: 1,
          };
        }
      } else {
        return {
          color: null,
          x: 1,
        };
      }
    }),
    filter(x => x.color !== null),
);

// Create a stream of events
// const eventStream = new Observable<Payload>((subscriber) => {
//   let count = 0;
//   setInterval(() => {
//     const random = colors[Math.floor(Math.random() * colors.length)];
//     subscriber.next({
//       color: random,
//       x: count++
//     });
//   }, 100); // Emit events every 100 milliseconds
// });

// Use the windowTime operator to create windows, then count each window
const windowDurationSeconds = 60;
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
  console.log(`windowTime() Events per ${windowDurationSeconds} seconds: ${count}`);
});

const groupByField = 'color';

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

console.log('rxjs groupBy routine starting...');
console.log(`Window: ${windowDurationSeconds}s`);
console.log(`Buffer: ${bufferDurationSeconds}s`);
console.log(`Group By Field: ${groupByField}`);
