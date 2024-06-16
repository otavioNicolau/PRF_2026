import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
const { height: screenHeight } = Dimensions.get('window');
const { width: screenWidth } = Dimensions.get('window');
import slide1 from '~/assets/PRF.png';

export const Slide = () => {
  return (
    <View>
      <Image source={slide1} style={styles.image} />
      <Text></Text>
      <Text></Text>
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
    height: screenHeight / 100 * 40,
    width: screenWidth,

  },
});
