import _internal_sense_hat as _ish
import time

class RTIMU:
  """
    https://github.com/richards-tech/RTIMULib2/blob/master/Linux/python/PyRTIMU_RTIMU.cpp
  """
  def __init__(self, imu_settings):
    self._imu_settings = imu_settings
    self._compass_enabled = True
    self._gyro_enabled = False
    self._accel_enabled = True
  
  def IMUInit(self):
    """
    Set up the IMU
    :return:
    """
    return True

  def IMUGyroBiasValid(self):
      return True

  def getCompassCalibrationValid(self):
      return True

  def getCompassCalibrationEllipsoidValid(self):
      return True

  def getAccelCalibrationValid(self):
      return True

  def IMUGyroBiasValid(self):
      return True

  def resetFusion(self):
      """
      Return true if valid bias
      :return:
      """
      pass

  def setSlerPower(self):
      """
      Enable or disable Gyro reading
      :return:
      """
      pass

  def setGyroEnable(selfs):
      pass

  def setAccelEnable(self):
      pass

  def setCompassEnable(self):
      pass

  def IMUGetPollInterval(self):
    """
      Get the recommended poll interval in mS
    """
    return 1
    
  def setCompassEnable(self, enabled):
    self._compass_enabled = enabled
  
  def setGyroEnable(self, enabled):
    self._gyro_enabled = enabled
    
  def setAccelEnable(self, enabled):
    self._accel_enabled = enabled
    
  def IMURead(self):
    return 3 # long
  
  def IMUName(self):
    return "DUNNO"
    
  def IMUType(self):
    return 1234556 #long
    
  def getIMUData(self):
    """
      https://github.com/richards-tech/RTIMULib2/blob/master/Linux/python/PyRTIMU_RTIMU.cpp#L189
    """
    return {
        "timestamp": time.time(),
        "fusionPoseValid": True,
        "fusionPose": self._getFusionPose(),
        "fusionQPoseValid": True,
        "gyroValid": False,
        "gyro": _ish.gyroRead(),
        "accelValid": True,
        "accel": _ish.accelRead(),
        "compassValid": False,
        "compass": _ish.compassRead(),
        "pressureValid": True,
        "pressure": _ish.pressureRead(),
        "temperatureValid": True,
        "temperature": _ish.temperatureRead(),
        "humidityValid": True,
        "humidity": _ish.humidityRead()
        }
  
  def _getFusionPose(self):
      if self._accel_enabled == False and self._gyro_enabled == False:
          # ToDo: special compass only handling for yaw data
          return _ish.fusionPoseRead()
          
      return _ish.fusionPoseRead()

class RTPressure:
  def __init__(self, imu_settings):
    self._imu_settings = imu_settings
  
  def pressureInit(self):
    return True
    
  def pressureRead(self):
    # return Py_BuildValue("idid", data.pressureValid, data.pressure, data.temperatureValid, data.temperature);
    return _ish.pressureRead();
  
  def pressureName(self):
    return "DUNNO"
    
  def pressureType(self):
    return 1234 # long
    
class RTHumidity:
  """
    https://github.com/richards-tech/RTIMULib2/blob/master/Linux/python/PyRTIMU_RTHumidity.cpp
  """
  def __init__(self, imu_settings):
    self._imu_settings = imu_settings
    
  def humidityInit(self):
    """
      Set up the humidity sensor
    """
    return True
    
  def humidityRead(self):
    """
      Get current values
    """
    #return Py_BuildValue("idid", data.humidityValid, data.humidity, data.temperatureValid, data.temperature);
    return _ish.humidityRead();

  def humidityType(self):
    """
      Get the type code of the humidity sensor
    """
    return 12345 # long

  def humidityName(self):
    """
      Get the name of the humidity sensor
    """
    return "DUNNO"

class Settings:
  def __init__(self, settings_path):
    self.settings_path = settings_path