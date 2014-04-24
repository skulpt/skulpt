class Navdata(object):
    '''
    drone navdata storage.

    this represents the current state of the drone.
    '''

    def __init__(self):
        # 0 means no battery, 100 means full battery
        self.battery = 50

        # 0: Unknown, 1: Init, 2: Landed, 3: Flying, 4: Hovering, 5: Test
        # 6: Taking off, 7: Goto Fix Point, 8: Landing, 9: Looping
        # Note: 3,7 seems to discriminate type of flying (isFly = 3 | 7)
        self.state = 0

        # magnetometer

        self.magX = 0
        self.magY = 0
        self.magZ = 0

        # pressure sensor
        self.pressure = 0

        # apparently, there was a temperature sensor added as well.
        self.temp = 0

        # wind sensing...
        self.wind_speed      = 0
        self.wind_angle      = 0
        self.wind_comp_angle = 0

        # left/right tilt in degrees (rotation about the X axis)
        self.rotX = 0

        # forward/backward tilt in degrees (rotation about the Y axis)
        self.rotY = 0

        # orientation in degrees (rotation about the Z axis)
        self.rotZ = 0

        # estimated altitude (cm)
        self.altd = 0

        # linear velocity (mm/sec)
        self.vx = 0

        # linear velocity (mm/sec)
        self.vy = 0

        # linear velocity (mm/sec)
        self.vz = 0

        #linear accelerations (unit: g)
        self.ax = 0
        self.ay = 0
        self.az = 0

        #motor commands (unit 0 to 255)
        self.motor1 = 0
        self.motor2 = 0
        self.motor3 = 0
        self.motor4 = 0

        #Tags in Vision Detectoion
        self.tags_count       = 0
        self.tags_type        = []
        self.tags_xc          = []
        self.tags_yc          = []
        self.tags_width       = []
        self.tags_height      = []
        self.tags_orientation = []
        self.tags_distance    = []

        #time stamp
        self.tm = 0
