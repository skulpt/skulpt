"""

quick hack script to convert from quake2 .bsp to simple format to draw. drops
most information. keeps only raw polys and lightmaps.

makes .blv and .llv file (big and little endian level)

file format is
    'BLV1' or 'LLV1'
    int texwidth
    int texheight
    int numtris
    float startx, starty, startz, startyaw (rads)
    uint32 texdata[texwidth*texheight]
    float texcoords[numtris*6]
    float verts[numtris*9]

this makes for trivial drawing, but of course it's very inefficient.

this is very different from the original format which has a bunch of
optimizations of pvs, culling, uses tris/quads/polys, level-specific data,
textures, etc. there's also lots of trickery to save space in packing,
indirection, etc. but we just flatten all that out to triangles. it's probably
faster these days for such small amounts of geometry anyway.

http://www.flipcode.com/archives/Quake_2_BSP_File_Format.shtml

scott.q2convert@h4ck3r.net

"""

import os
import sys
import struct

def strunpack(stream, format):
    return struct.unpack(format, stream.read(struct.calcsize(format)))

def die(msg):
    print msg
    raise SystemExit(1)

def convCoord(v):
    """swizzle, the quake order is wacky. also scale by an arbitrary amount."""
    scale = 1.0/15.0
    return (v[1]*scale, v[2]*scale, v[0]*scale)

def loadRawData(raw):
    # header
    headerstr = "IIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII"
    data = (magic, version,
            off_Entities, len_Entities,
            off_Planes, len_Planes,
            off_Vertices, len_Vertices,
            off_Visibility, len_Visibility,
            off_Nodes, len_Nodes,
            off_Texture_Information, len_Texture_Information,
            off_Faces, len_Faces,
            off_Lightmaps, len_Lightmaps,
            off_Leaves, len_Leaves,
            off_Leaf_Face_Table, len_Leaf_Face_Table,
            off_Leaf_Brush_Table, len_Leaf_Brush_Table,
            off_Edges, len_Edges,
            off_Face_Edge_Table, len_Face_Edge_Table,
            off_Models, len_Models,
            off_Brushes, len_Brushes,
            off_Brush_Sides, len_Brush_Sides,
            off_Pop, len_Pop,
            off_Areas, len_Areas,
            off_Area_Portals, len_Area_Portals) = struct.unpack_from(headerstr, raw)


    if struct.pack("BBBB", magic>>24, (magic>>16)&0xff, (magic>>8)&0xff, magic&0xff) != "PSBI": die("Bad header")
    if version != 38: die("Bad version")

    Leaves = []
    leaf_Size = 28
    for i in range(len_Leaves / leaf_Size):
        (brush_or,
         cluster,
         area,
         bbox_minX, bbox_minY, bbox_minZ,
         bbox_maxX, bbox_maxY, bbox_maxZ,
         first_leaf_face, num_leaf_faces,
         first_leaf_brush, num_leaf_brushes) = struct.unpack_from("IHHhhhhhhHHHH", raw, off_Leaves + i*leaf_Size)
        Leaves.append((first_leaf_face, num_leaf_faces))
    print "Leaves: %d" % len(Leaves)

    Leaf_Face_Table = []
    leafface_Size = 2
    for i in range(len_Leaf_Face_Table / leafface_Size):
        Leaf_Face_Table.append(struct.unpack_from("H", raw, off_Leaf_Face_Table + i*leafface_Size)[0])

    Faces = []
    face_Size = 20
    for i in range(len_Faces / face_Size):
        (plane, plane_Size,
         first_edge, num_edges,
         texture_info,
         style0, style1, style2, style3,
         lightmap_offset) = struct.unpack_from("HHIHHBBBBI", raw, off_Faces + i*face_Size)
        Faces.append((first_edge, num_edges, lightmap_offset))
    print "Faces: %d" % len(Faces)

    Face_Edge_Table = []
    faceedge_Size = 4
    for i in range(len_Face_Edge_Table / faceedge_Size):
        Face_Edge_Table.append(struct.unpack_from("i", raw, off_Face_Edge_Table + i*faceedge_Size)[0])

    Edges = []
    edge_Size = 4
    for i in range(len_Edges / edge_Size):
        (v0, v1) = struct.unpack_from("HH", raw, off_Edges + i*edge_Size)
        Edges.append((v0, v1))
    print "Edges: %d" % len(Edges)
    
    Vertices = []
    vert_Size = 12
    for i in range(len_Vertices / vert_Size):
        v = struct.unpack_from("fff", raw, off_Vertices + i*vert_Size)
        Vertices.append(convCoord(v))
    print "Vertices: %d" % len(Vertices)

    ents = struct.unpack_from("%ds" % len_Entities, raw, off_Entities)[0][1:-3] # opening { and final }+nul
    Entities = []
    for ent in ents.split("}\n{"):
        entdata = {}
        for line in ent.lstrip("\n").rstrip("\n").split("\n"):
            k,v = line.lstrip('"').rstrip('"').split('" "')
            entdata[k] = v
        Entities.append(entdata)

    return Leaves, Leaf_Face_Table, Faces, Face_Edge_Table, Edges, Vertices, Entities

def writeBinary(triverts, Entities, packprefix, fileext):

    playerStart = findEntity(Entities, "info_player_start")
    sx, sy, sz = playerStart['origin'].split(' ')

    numtris = len(triverts) / 9
    texwidth = 0
    texheight = 0
    startx, starty, startz = convCoord((float(sx), float(sy), float(sz)))
    startyaw = float(playerStart['angle'])
    texcoords = (0.0, 0.0) * numtris * 3

    outname = os.path.splitext(sys.argv[1])[0] + fileext
    print "writing", outname + "...",
    out = open(outname, "wb")
    out.write(struct.pack(packprefix + "4sIIIffff", 'LLV1', texwidth, texheight, numtris, startx, starty, startz, startyaw))
    for i in range(numtris*3):
        out.write(struct.pack(packprefix + "ff", 0.0, 0.0))
    for tv in triverts:
        out.write(struct.pack(packprefix + "f", tv))
    out.close()
    print "done"

def findEntity(entities, class_name):
    for item in entities:
        if item['classname'] == class_name:
            return item

def main():
    if len(sys.argv) != 2: die("usage: convert <quake2.bsp>")

    raw = open(sys.argv[1], "rb").read()

    # Leaves are first+len into Leaf_Face_Table
    # Leaf_Face_Table is indices into Faces
    # Faces is first+len into Face_Edge_Table
    # Face_Edge_Table is indices of Edges. if index is positive then (v0,v1) for the edge else (v1,v0)
    # Edges is pairs of indices into Vertices
    # Vertices are list of 3 floats
    #
    # Seems crazily complicated these days (thankfully :)

    Leaves, Leaf_Face_Table, Faces, Face_Edge_Table, Edges, Vertices, Entities = loadRawData(raw)

    triverts = []

    # get all polys
    for first_leaf_face, num_leaf_faces in Leaves:
        for leaf_face_i in range(first_leaf_face, first_leaf_face + num_leaf_faces):
            face_index = Leaf_Face_Table[leaf_face_i]
            first_face_edge, num_face_edges, lightmapoffset = Faces[face_index]
            polyedges = []
            for face_edge_i in range(first_face_edge, first_face_edge + num_face_edges):
                edgei_signed = Face_Edge_Table[face_edge_i]
                #print "edgei:", edgei_signed
                if edgei_signed >= 0:
                    e0, e1 = Edges[edgei_signed]
                else:
                    e1, e0 = Edges[-edgei_signed]
                v0 = Vertices[e0]
                v1 = Vertices[e1]
                polyedges.append((v0, v1))
                #print "(%f,%f,%f) -> (%f,%f,%f)" % (v0[0], v0[1], v0[2], v1[0], v1[1], v1[2])
            polyverts = []
            for pei in range(len(polyedges)):
                if polyedges[pei][1] != polyedges[(pei+1) % len(polyedges)][0]:
                    die("poly isn't normal closed style")
                polyverts.append(polyedges[pei][0])
            for i in range(1, len(polyverts) - 1):
                triverts.extend(polyverts[0])
                triverts.extend(polyverts[i])
                triverts.extend(polyverts[i+1])
                texid.append(lightmapoffset)



    writeBinary(triverts, Entities, "<", ".llv")
    writeBinary(triverts, Entities, ">", ".blv")

if __name__ == "__main__": main()
