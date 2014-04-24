'''
Created on 17.03.2014

@author: tatsch
'''

class Navdata(object):
    '''
    Navdata
    '''

    # 0 means no battery, 100 means full battery
    battery = 50

    # 0: Unknown, 1: Init, 2: Landed, 3: Flying, 4: Hovering, 5: Test
    # 6: Taking off, 7: Goto Fix Point, 8: Landing, 9: Looping
    # Note: 3,7 seems to discriminate type of flying (isFly = 3 | 7)
    state = 0

    # magnetometer

    magX = 0
    magY = 0
    magZ = 0

    # pressure sensor
    pressure = 0

    # apparently, there was a temperature sensor added as well.
    temp = 0

    # wind sensing...
    wind_speed      = 0
    wind_angle      = 0
    wind_comp_angle = 0

    # left/right tilt in degrees (rotation about the X axis)
    rotX = 0

    # forward/backward tilt in degrees (rotation about the Y axis)
    rotY = 0

    # orientation in degrees (rotation about the Z axis)
    rotZ = 0

    # estimated altitude (cm)
    altd = 0

    # linear velocity (mm/sec)
    vx = 0

    # linear velocity (mm/sec)
    vy = 0

    # linear velocity (mm/sec)
    vz = 0

    #linear accelerations (unit: g)
    ax = 0
    ay = 0
    az = 0

    #motor commands (unit 0 to 255)
    motor1 = 0
    motor2 = 0
    motor3 = 0
    motor4 = 0

    #Tags in Vision Detectoion
    tags_count       = 0
    tags_type        = []
    tags_xc          = []
    tags_yc          = []
    tags_width       = []
    tags_height      = []
    tags_orientation = []
    tags_distance    = []

    #time stamp
    tm = 0
