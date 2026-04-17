import { StyleSheet } from 'react-native';

const OVERLAY_COLOR = 'rgba(0,0,0,0.55)';
const FRAME_W = 310; // wide rectangle for record-ref labels
const FRAME_H = 90;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'column',
  },
  topMask: {
    flex: 1,
    backgroundColor: OVERLAY_COLOR,
  },
  middle: {
    height: FRAME_H,
    flexDirection: 'row',
  },
  sideMask: {
    flex: 1,
    backgroundColor: OVERLAY_COLOR,
  },
  frame: {
    width: FRAME_W,
    height: FRAME_H,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  bottomMask: {
    flex: 1,
    backgroundColor: OVERLAY_COLOR,
  },
});

export default styles;
