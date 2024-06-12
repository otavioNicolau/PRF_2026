import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
const { height: screenHeight } = Dimensions.get('window');
const { width: screenWidth } = Dimensions.get('window');
import tumb from '~/assets/tumb.png';

export const Tumb = () => {
  return (
    <View>
      <Image source={tumb} style={styles.image} />
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    resizeMode: 'contain',
    height: 300,
    width: '80%',
    margin:0,
    padding:0,

  },
});
