import React from 'react';
import { StyleSheet, Text, View, Button, Easing, TouchableHighlight, TouchableOpacity, ScrollView, FlatList, ViewStyle } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
// import 'react-native-get-random-values';
// import { v1 as uuidv1 } from 'uuid';

class Stopwatch {
  startTime = 0;
  stopTime = 0;
  savedTime = 0;
  increment = 0;
  id = '';
  stateUpdater = (time: number, started: boolean, id: string, forceUpdate: boolean) => {};

  constructor(stateUpdater: (time: number, started: boolean, id: string, forceUpdate: boolean) => void) {
    this.stateUpdater = stateUpdater;
    this.id = Number(new Date()).toString();
    this.onTick(true);
  }

  isStarted = () => Boolean(this.increment);

  toggleStart = () => {
    if (this.isStarted()) {
      this.stop();
    } else {
      this.start();
    }
  }

  start = () => {
    if (!this.isStarted()) {
      this.startTime = Number(new Date());
      this.increment = setInterval(this.onTick, 33);
      // this.increment = 1;
    }
  }

  stop = () => {
    if (this.isStarted()) {
      clearInterval(this.increment);
      this.increment = 0;
      this.stopTime = Number(new Date());
      this.savedTime += (this.stopTime - this.startTime);
      this.onTick(true);
    }
  }

  getElapsed = () => {
    if (!this.isStarted()) {
      return this.savedTime;
    }
    return this.savedTime + (Number(new Date()) - this.startTime);
  }

  onTick = (forceUpdate: boolean) => {
    this.stateUpdater(this.getElapsed(), this.isStarted(), this.id, forceUpdate);
  }

  reset = () => {
    if (this.isStarted()) {
      this.toggleStart();
    }
    this.startTime = 0;
    this.stopTime = 0;
    this.savedTime = 0;
    this.onTick(true);
  }
}

export default class App extends React.Component {
  state = {
    watchStates: {} as any,
  }

  stateUpdater = (time: number, started: boolean, id: string, forceUpdate: boolean) => {
    this.state.watchStates[id] = { time, started };
    // Defer actually updating state to the background loop, so we can batch update for all the stopwatches
    if (forceUpdate) {
      this.setState({ watchStates: this.state.watchStates });
    }
  }

  watches: Stopwatch[] = [];
  
  componentDidMount() {
    // Actually apply the state updates every once in a while, to make it more efficient when running multiple watches
    setInterval(() => {
      this.setState({ watchStates: this.state.watchStates });
    }, 33);
    this.addStopwatch();
  }

  addStopwatch = () => {
    this.watches.push(new Stopwatch(this.stateUpdater));
  }

  removeStopwatch = (i: number) => {
    const removedWatch = this.watches.splice(i, 1)[0];
    removedWatch.stop();
    delete this.state.watchStates[removedWatch.id];
    this.setState({ watchStates: this.state.watchStates });
  }

  startAll = () => {
    this.watches.forEach(watch => watch.start());
  }

  stopAll = () => {
    this.watches.forEach(watch => watch.stop());
  }

  resetAll = () => {
    this.watches.forEach(watch => watch.reset());
  }

  toggleStart = (i: number) => {
    this.watches[i].toggleStart();
  }

  reset = (i: number) => {
    this.watches[i].reset();
  }

  render() {
    // TODO large/small views
    
    return (
      <View style={styles.container}>
        <View style={styles.buttonLine}>
          <TouchableOpacity style={styles.buttonContainer} onPress={() => this.startAll()}>
            <Text style={styles.button}>▶</Text>
            <Text style={styles.buttonText}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.redButtonContainer} onPress={() => this.stopAll()}>
            <Text style={styles.button}>■</Text>
            <Text style={styles.buttonText}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.grayButtonContainer} onPress={() => this.resetAll()}>
            <Text style={styles.button}>↺</Text>
            <Text style={styles.buttonText}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.blueButtonContainer} onPress={() => this.addStopwatch()}>
              <Text style={styles.button}>+</Text>
            </TouchableOpacity>
        </View>
        <FlatList
          style={styles.watchList}
          data={Object.keys(this.state.watchStates)}
          keyExtractor={(item, index) => item}
          renderItem={({ item, index }: { item: any, index: number }) => {
            const value = this.state.watchStates[item];
            let percent = (Math.floor(value.time / 500) * 500 / 60000 * 100) % 100
            // console.log(percent);
            return <View key={item} style={styles.card}>
              <AnimatedCircularProgress
              key={(percent === 0).toString()}
              size={300}
              duration={500}
              width={15}
              rotation={0}
              lineCap={'round'}
              easing={Easing.linear as any}
              fill={percent}
              tintColor="#00e0ff"
              tintColorSecondary="#00ff00"
              backgroundColor="#3d5875"
          >
            {
              (fill) => (
                <Text style={ styles.time }>
                  {formatMilliseconds(value.time)}
                </Text>
              )
            }
          </AnimatedCircularProgress>
          <View style={styles.buttonLine}>
            <TouchableOpacity style={value.started ? styles.redButtonContainer : styles.buttonContainer} onPress={() => this.toggleStart(index)}>
              <Text style={styles.button}>{value.started ? '■' : '▶'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.grayButtonContainer} onPress={() => this.reset(index)}>
              <Text style={styles.button}>↺</Text>
            </TouchableOpacity>
          </View>
          { index !== 0 && <TouchableOpacity style={{...styles.closeIcon}} onPress={() => this.removeStopwatch(index)}>
              <Text style={styles.button}>✕</Text>
            </TouchableOpacity>}
          </View>;
          }}
        >
        </FlatList>
      </View>
    );
  }
}

function formatMilliseconds(input: number) {
  const ms = input % 1000;
  const seconds = Math.floor(input / 1000) % 60;
  const minutes = Math.floor(input / (60 * 1000)) % 60;
  const hours = Math.floor(input / (60 * 60 * 1000));
  return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

const buttonContainer = {
  borderWidth:1,
  borderColor:'rgba(0,0,0,0.2)',
  alignItems:'center',
  justifyContent:'center',
  backgroundColor: '#32CD32',
  width: 80,
  height: 80,
  borderRadius: 40,
  marginTop: 30,
  margin: 10,
} as ViewStyle;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#222',
    padding: 10,
    margin: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderRadius: 15,
  },
  watchList: {
    width: '100%'
  },
  time: {
    fontSize: 30,
    letterSpacing: 1,
    color: '#fff'
  },
  button: {
    color: '#fff',
    fontSize: 40,
    lineHeight: 45,
  },
  buttonText: {
    position: 'absolute',
    bottom: 5,
    color: '#fff',
  },
  buttonContainer,
  redButtonContainer: {
    ...buttonContainer,
    backgroundColor: '#B03060',
  },
  grayButtonContainer: {
    ...buttonContainer,
    backgroundColor: '#A0A0A0',
  },
  blueButtonContainer: {
    ...buttonContainer,
    backgroundColor: '#0E6EB8',
  },
  blackButtonContainer: {
    ...buttonContainer,
    backgroundColor: '#000000',
  },
  buttonLine: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  closeIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  }
});
