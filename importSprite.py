from collections import defaultdict

import bpy

scene = bpy.context.scene

color_map = defaultdict(list)
filename = "dude1.png"
img = bpy.data.images[filename]
scale = 0.3


def idx_to_co(idx, width):
    r = int(idx / width)
    c = idx % width
    return r, c

def co_to_idx(r, c, width):
    return r * width + c


def rgba_from_index(idx, pxs):
    start_raw_index = idx * 4
    return pxs[start_raw_index:start_raw_index+4]


def sv_main():

    def is_fully_opaque(rgba):
        return rgba[3] == 1.0

    pixels = img.pixels
    pxs = list(pixels)

    w = width = img.size[0]
    h = height = img.size[1]

    num_pixels = len(pxs)
    gl = grouped_list = [pxs[i:i+4] for i in range(num_pixels)[::4]]

    for c in range(w):
        for r in range(h):
            idx = co_to_idx(r, c, w)
            rgba = rgba_from_index(idx, pxs)
            if is_fully_opaque(rgba):
                color_map[tuple(rgba[:3])].append([r*scale, -c*scale, 0.0])


def create_repr_plane(obj_name, mesh_name, vlist):
    s = scale/2
    verts = []
    v_add = verts.extend
    faces = []
    f_add = faces.append

    for i, v in enumerate(vlist):
        x, y = v[:2]
        v_add([[-s+x, s+y, 0], [-s+x, -s+y, 0], [s+x, -s+y, 0], [s+x, s+y, 0]])

        offset = i*4
        f_add([0 + offset, 1 + offset, 2 + offset, 3 + offset])

    profile_mesh = bpy.data.meshes.new(obj_name)
    profile_mesh.from_pydata(verts, [], faces)
    profile_mesh.update()

    profile_object = bpy.data.objects.new(obj_name, profile_mesh)

#- bpy.context.scene.objects.link(object)
#+ bpy.context.collection.objects.link(object)

    bpy.context.collection.objects.link(profile_object)
    return profile_object


sv_main()

for i, (k, v) in enumerate(color_map.items()):

    obj = create_repr_plane("dupli_object_" + str(i), "dupli_mesh_" + str(i), v)

    repr_of_color = "{0:.4f} {1:.4f} {2:.4f}".format(*k)
    mat = bpy.data.materials.new('sv_material_' + repr_of_color)
    mat.use_nodes = True
    mat.use_fake_user = True  # usually handy
    obj.active_material = mat
    nodes = mat.node_tree.nodes
    nodes["Diffuse BSDF"].inputs[0].default_value = list(k) + [1]
